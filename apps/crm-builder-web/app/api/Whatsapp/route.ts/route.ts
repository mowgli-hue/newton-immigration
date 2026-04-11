// app/api/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleIncomingReply } from "@/lib/whatsapp-ai-intake";
import { listCases } from "@/lib/store";

// GET - Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST - Incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{ from: string; text?: { body: string }; type: string; id: string }>;
            statuses?: Array<{ id: string; status: string }>;
          };
        }>;
      }>;
    };

    const value = body?.entry?.[0]?.changes?.[0]?.value;
    if (!value) return NextResponse.json({ status: "ok" });

    const messages = value?.messages;
    if (messages && messages.length > 0) {
      for (const message of messages) {
        if (message.type !== "text") continue;
        const from = message.from;
        const text = message?.text?.body || "";
        console.log(`WhatsApp from ${from}: ${text}`);
        try {
          const companyId = await findCompanyForPhone(from);
          if (companyId) {
            await handleIncomingReply({ phone: from, message: text, companyId });
          }
        } catch (err) {
          console.error("Error handling WhatsApp message:", err);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ status: "ok" });
  }
}

async function findCompanyForPhone(phone: string): Promise<string | null> {
  try {
    const companyId = process.env.DEFAULT_COMPANY_ID || "newton";
    const cases = await listCases(companyId);
    const n = phone.replace(/\D/g, "");
    const matched = cases.find((c) => {
      const cp = (c.leadPhone || "").replace(/\D/g, "");
      return cp && (n.endsWith(cp) || cp.endsWith(n));
    });
    return matched ? companyId : null;
  } catch {
    return null;
  }
}
