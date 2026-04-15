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
    // Get proper extension from mime type
    const extMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "image/jpeg": ".jpg", "image/jpg": ".jpg",
      "image/png": ".png",
      "image/heic": ".heic",
      "application/zip": ".zip",
      "application/x-zip-compressed": ".zip",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
      "video/mp4": ".mp4",
      "audio/ogg": ".ogg", "audio/mpeg": ".mp3",
    };
    const ext = extMap[mimeType] || (mimeType.includes("zip") ? ".zip" : mimeType.includes("pdf") ? ".pdf" : mimeType.includes("image") ? ".jpg" : ".bin");
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
        const originalFilename = message[msgType]?.filename || message[msgType]?.name || null;
        const mediaCaption = message[msgType]?.caption || originalFilename || message[msgType]?.filename || msgType;

        if (mediaId) {
          console.log(`📎 WA media from ${matched.client}: ${mediaCaption}`);
          try {
            const media = await downloadWaMedia(mediaId);
            if (media) {
              // Upload to Drive or S3 as fallback
              const { uploadFileToDriveFolder, extractDriveFolderId } = await import("@/lib/google-drive");
              const { putObjectToS3, buildS3ObjectKey, toS3StoredLink, isS3StorageEnabled } = await import("@/lib/object-storage");
              const caseItem = await getCase(COMPANY_ID, matched.id);
              let driveFolderId = extractDriveFolderId(caseItem?.docsUploadLink || "");
              // Auto-create Drive folder if none exists
              if (!driveFolderId) {
                try {
                  const { createCaseDriveStructure } = await import("@/lib/google-drive");
                  const { updateCaseLinks } = await import("@/lib/store");
                  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";
                  if (rootFolderId) {
                    const structure = await createCaseDriveStructure(rootFolderId, `${matched.client} - ${matched.formType}`);
                    driveFolderId = structure.subfolders.clientDocuments.id;
                    await updateCaseLinks(matched.companyId || COMPANY_ID, matched.id, {
                      docsUploadLink: structure.subfolders.clientDocuments.webViewLink,
                      applicationFormsLink: structure.subfolders.applicationForms.webViewLink,
                      submittedFolderLink: structure.subfolders.submitted.webViewLink,
                      correspondenceFolderLink: structure.subfolders.correspondence.webViewLink,
                    });
                    console.log(`📁 Auto-created Drive folders for ${matched.client}`);
                  }
                } catch (e) {
                  console.error("Auto Drive folder creation failed:", e);
                }
              }
              let savedLink = "";
              if (driveFolderId) {
                const saveFileName = originalFilename || `WA_${matched.client}_${media.filename}`;
                try {
                  const driveRes = await uploadFileToDriveFolder({
                    folderId: driveFolderId,
                    fileName: saveFileName,
                    fileBuffer: media.buffer,
                    mimeType: media.mimeType
                  });
                  savedLink = driveRes.webViewLink || "";
                  console.log(`✅ Saved to Drive: ${saveFileName}`);
                } catch (e) {
                  console.error("Drive upload failed, trying S3:", e);
                }
              }
              // S3 fallback — always save regardless of Drive
              if (isS3StorageEnabled()) {
                try {
                  const s3Key = buildS3ObjectKey({ companyId: COMPANY_ID, caseId: matched.id, fileName: originalFilename || media.filename });
                  await putObjectToS3({ key: s3Key, body: media.buffer, contentType: media.mimeType });
                  if (!savedLink) savedLink = toS3StoredLink(s3Key);
                  console.log(`✅ Saved to S3: ${s3Key}`);
                } catch (e) {
                  console.error("S3 upload failed:", e);
                }
              }
              // AI classify the document
              let docCategory = "client";
              let docName = originalFilename || mediaCaption || media.filename;
              let properFileName = docName;

              try {
                const classifyRes = await fetch("https://api.anthropic.com/v1/messages", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.ANTHROPIC_API_KEY || "",
                    "anthropic-version": "2023-06-01"
                  },
                  body: JSON.stringify({
                    model: "claude-haiku-4-5-20251001",
                    max_tokens: 150,
                    messages: [{
                      role: "user",
                      content: `Classify this document for an immigration application.
Filename: "${docName}"
File type: ${media.mimeType}
Client name: ${matched.client}
Application type: ${matched.formType}

Reply with ONLY a JSON object:
{"category": "passport|study_permit|work_permit|completion_letter|transcripts|language_test|photo|bank_statement|job_offer|medical|police_clearance|other", "label": "Short document label e.g. Passport, Study Permit, Completion Letter"}`
                    }]
                  })
                });
                if (classifyRes.ok) {
                  const classifyData = await classifyRes.json() as any;
                  const raw = classifyData.content?.[0]?.text || "{}";
                  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
                  if (parsed.category) docCategory = parsed.category;
                  if (parsed.label) {
                    // Rename file: [Client Name]- [Label].ext
                    const clientNameClean = String(matched.client || "").replace(/[^a-zA-Z0-9 ]/g, "").trim();
                    const ext = docName.includes(".") ? docName.split(".").pop() : media.mimeType.includes("pdf") ? "pdf" : "jpg";
                    properFileName = `${clientNameClean}- ${parsed.label}.${ext}`;
                    console.log(`🤖 AI classified: ${docName} → ${properFileName} (${docCategory})`);
                  }
                }
              } catch (e) {
                console.error("AI doc classification failed (non-fatal):", e);
              }

              // Re-upload with proper filename to Drive
              let driveLink = "";
              if (driveFolderId && properFileName !== docName) {
                try {
                  const driveResult = await uploadFileToDriveFolder({
                    folderId: driveFolderId,
                    fileName: properFileName,
                    fileBuffer: media.buffer,
                    mimeType: media.mimeType
                  });
                  driveLink = driveResult.webViewLink || "";
                } catch { /* already uploaded above */ }
              }

              // Also save as document in case
              const { addDocument, updateCasePgwpIntake } = await import("@/lib/store");
              await addDocument({
                companyId: COMPANY_ID,
                caseId: matched.id,
                name: properFileName,
                category: docCategory,
                uploadedBy: matched.client || "Client (WhatsApp)",
                status: "received",
                link: driveLink || `wa://media/${mediaId}`
              });

              // If passport detected — extract data and auto-fill intake fields
              if (docCategory === "passport" && (media.mimeType.includes("image") || media.mimeType.includes("pdf"))) {
                try {
                  const imageBase64 = media.buffer.toString("base64");
                  const extractRes = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
                    body: JSON.stringify({
                      model: "claude-haiku-4-5-20251001",
                      max_tokens: 400,
                      messages: [{
                        role: "user",
                        content: [
                          { type: "image", source: { type: "base64", media_type: media.mimeType as any, data: imageBase64 } },
                          { type: "text", text: `Extract passport data from this image. Reply ONLY with valid JSON (no markdown): {"firstName": "", "lastName": "", "fullName": "", "dateOfBirth": "YYYY-MM-DD", "passportNumber": "", "passportIssueDate": "YYYY-MM-DD", "passportExpiryDate": "YYYY-MM-DD", "nationality": "", "placeOfBirth": "", "gender": ""}` }
                        ]
                      }]
                    })
                  });
                  if (extractRes.ok) {
                    const extractData = await extractRes.json() as any;
                    const raw = extractData.content?.[0]?.text || "{}";
                    const passport = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, "").trim());
                    if (passport.passportNumber) {
                      await updateCasePgwpIntake(COMPANY_ID, matched.id, {
                        firstName: passport.firstName,
                        lastName: passport.lastName,
                        fullName: passport.fullName,
                        dateOfBirth: passport.dateOfBirth,
                        passportNumber: passport.passportNumber,
                        passportIssueDate: passport.passportIssueDate,
                        passportExpiryDate: passport.passportExpiryDate,
                        citizenship: passport.nationality,
                        placeOfBirthCity: passport.placeOfBirth,
                      } as any);
                      console.log(`📘 Passport data extracted for ${matched.client}: ${passport.passportNumber}`);
              const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
              if (baseUrl) {
                fetch(`${baseUrl}/api/cases/${matched.id}/generate-forms`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ systemToken: process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024" })
                }).then(r => r.json()).then(d => {
                  console.log(`📄 Auto PDF after passport for ${matched.id}:`, d.generated);
                }).catch(e => console.error("Auto PDF failed:", e));
              }
                    }
                  }
                } catch (e) {
                  console.error("Passport extraction failed (non-fatal):", e);
                }
              }

              // Send confirmation with what was identified
              const { sendWhatsAppText } = await import("@/lib/whatsapp");
              const firstName = String(matched.client || "").split(" ")[0];
              const docLabel = properFileName.split("- ")[1]?.replace(/\.[^.]+$/, "") || "document";
              await sendWhatsAppText(from, `✅ Got it ${firstName}! I've saved your *${docLabel}* to your file. Our team will review it. 🙏\n\n— Newton Immigration Team`);
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
          console.log(`🔍 Session lookup for ${from}: ${session ? `FOUND phase=${session.phase}` : "NOT FOUND"}`);
          
          // Skip intake for College Change / Study Permit Extension cases
          const skipFormTypes = ["college change", "college transfer", "study permit extension", "spe"];
          const matchedFormType = String(matched?.formType || "").toLowerCase();
          const skipIntake = skipFormTypes.some(t => matchedFormType.includes(t));
          
          if (session && !skipIntake) {
            await intakeMod.handleIncomingReply({ phone: from, message: text, companyId: COMPANY_ID });
            handledByIntake = true;
          } else if (session && skipIntake) {
            console.log(`⏭️ Skipping intake for ${matched?.formType} — forwarding to team`);
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

          // Smart AI auto-reply for client messages
          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://junglecrm-builder-web-production-d358.up.railway.app";
            const aiRes = await fetch(`${appUrl}/api/ai-reply`, {
              method: "POST",
              headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
              body: JSON.stringify({
                phone: from,
                message: text,
                caseId: matched.id,
                action: "send",
                systemToken: process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024"
              })
            });
            if (aiRes.ok) {
              console.log(`🤖 AI smart reply sent to ${matched.client}`);
            } else {
              console.error(`🤖 AI reply failed: ${aiRes.status}`);
            }
          } catch (e) {
            console.error("AI auto-reply failed (non-fatal):", e);
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
