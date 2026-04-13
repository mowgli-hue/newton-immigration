import { NextRequest, NextResponse } from "next/server";

const COMPANY_ID = process.env.DEFAULT_COMPANY_ID || "newton";
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

// Download media from WhatsApp
async function downloadWaMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string; filename: string } | null> {
  try {
    // Get media URL
    const urlRes = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` }
    });
    const urlData = await urlRes.json() as { url?: string; mime_type?: string };
    if (!urlData.url) return null;

    // Download the file
    const fileRes = await fetch(urlData.url, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` }
    });
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    const mimeType = urlData.mime_type || "application/octet-stream";
    const ext = mimeType.includes("pdf") ? ".pdf" : mimeType.includes("jpeg") ? ".jpg" : mimeType.includes("png") ? ".png" : ".bin";
    const filename = `wa_doc_${Date.now()}${ext}`;
    return { buffer, mimeType, filename };
  } catch (e) {
    console.error("Failed to download WA media:", (e as Error).message);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as any;
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value) return NextResponse.json({ status: "ok" });

    const messages = value?.messages;
    if (!messages?.length) return NextResponse.json({ status: "ok" });

    for (const message of messages) {
      const from = message.from;
      const msgType = message.type; // text, image, document, audio
      const text = message?.text?.body || "";

      const { listCases, addMessage, updateCase, getCase } = await import("@/lib/store");
      const cases = await listCases(COMPANY_ID);
      const n = from.replace(/\D/g, "");

      // Find matching case by phone
      const matched = cases.find((c) => {
        const cp = (c.leadPhone || "").replace(/\D/g, "");
        return cp && (n.endsWith(cp.slice(-9)) || cp.endsWith(n.slice(-9)));
      });

      // Save to inbox
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await pool.query(`CREATE TABLE IF NOT EXISTS whatsapp_inbox (
          id TEXT PRIMARY KEY, phone TEXT NOT NULL, message TEXT NOT NULL,
          direction TEXT NOT NULL DEFAULT 'inbound', matched_case_id TEXT,
          matched_case_name TEXT, is_read BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        const msgId = `WA-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
        const displayMsg = msgType === "text" ? text : `[${msgType} received]`;
        // Auto-unarchive if client messages again after case was archived
        await pool.query(`UPDATE whatsapp_inbox SET is_archived = FALSE WHERE phone = $1 AND is_archived = TRUE`, [from]).catch(() => {});
        await pool.query(
          `INSERT INTO whatsapp_inbox (id, phone, message, direction, matched_case_id, matched_case_name, is_read) VALUES ($1,$2,$3,'inbound',$4,$5,FALSE)`,
          [msgId, from, displayMsg, matched?.id || null, matched?.client || null]
        );
        await pool.end();
      } catch { /* non-fatal */ }

      // Handle document/image uploads → save to Drive
      if (matched && (msgType === "document" || msgType === "image" || msgType === "audio")) {
        const mediaId = message[msgType]?.id;
        const mediaCaption = message[msgType]?.caption || message[msgType]?.filename || msgType;

        if (mediaId) {
          console.log(`📎 WA media from ${matched.client}: ${mediaCaption}`);
          try {
            const media = await downloadWaMedia(mediaId);
            if (media) {
              // Upload to Drive via the documents API
              const { uploadFileToDriveFolder, extractDriveFolderId } = await import("@/lib/google-drive");
              const caseItem = await getCase(COMPANY_ID, matched.id);
              const driveFolderId = extractDriveFolderId(caseItem?.docsUploadLink || "");
              if (driveFolderId) {
                await uploadFileToDriveFolder({
                  folderId: driveFolderId,
                  fileName: `WA_${matched.client}_${media.filename}`,
                  fileBuffer: media.buffer,
                  mimeType: media.mimeType
                });
                console.log(`✅ Saved to Drive: WA_${matched.client}_${media.filename}`);
              }
              // Also save as document in case
              const { addDocument } = await import("@/lib/store");
              await addDocument({
                companyId: COMPANY_ID,
                caseId: matched.id,
                name: mediaCaption || media.filename,
                category: "client",
                uploadedBy: matched.client || "Client (WhatsApp)",
                fileLink: `wa://media/${mediaId}`
              });
              // Send confirmation
              const { sendWhatsAppText } = await import("@/lib/whatsapp");
              const firstName = String(matched.client || "").split(" ")[0];
              await sendWhatsAppText(from, `✅ Got it ${firstName}! Your document has been saved to your file. Our team will review it.`);
            }
          } catch (e) {
            console.error("Media upload error:", (e as Error).message);
          }
        }
      }

      // Handle text messages — intake flow or general message notification
      if (msgType === "text" && text) {
        let handledByIntake = false;
        try {
          const intakeMod = await import("@/lib/whatsapp-ai-intake");
          const session = await intakeMod.getActiveSession(from, COMPANY_ID);
          if (session) {
            await intakeMod.handleIncomingReply({ phone: from, message: text, companyId: COMPANY_ID });
            handledByIntake = true;
          }
        } catch (e) {
          console.error("Intake handler error:", (e as Error).message);
        }

        // If not an intake reply — it's a general client question, notify team
        if (!handledByIntake && matched) {
          try {
            const { readStore, writeStore } = await import("@/lib/store");
            const store = await readStore();

            // Find assigned staff user
            const assignedName = matched.assignedTo || "";
            const staffUser = store.users?.find((u: any) =>
              String(u.name || "").toLowerCase() === assignedName.toLowerCase() &&
              u.companyId === COMPANY_ID
            );

            // Create notification for assigned staff (or all admins if unassigned)
            const targets = staffUser
              ? [staffUser]
              : (store.users || []).filter((u: any) => u.companyId === COMPANY_ID && ["Admin", "ProcessingLead"].includes(u.role));

            for (const target of targets.slice(0, 3)) {
              const notice = {
                id: `NTF-WA-${Date.now()}-${target.id}`,
                companyId: COMPANY_ID,
                userId: target.id,
                type: "ai_alert" as const,
                message: `💬 ${matched.client} sent a message: "${text.slice(0, 80)}${text.length > 80 ? "..." : ""}" — Please reply`,
                caseId: matched.id,
                read: false,
                createdAt: new Date().toISOString()
              };
              if (!store.notifications) store.notifications = [];
              store.notifications.unshift(notice);
            }
            await writeStore(store);
            console.log(`🔔 Notified team about message from ${matched.client}`);
          } catch (e) {
            console.error("Team notification error:", (e as Error).message);
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    console.error("WA webhook error:", (e as Error).message);
    return NextResponse.json({ status: "ok" });
  }
}
