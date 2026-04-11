import { NextRequest, NextResponse } from "next/server";

// GET - Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("WhatsApp webhook verification failed", { mode, token });
  return new NextResponse("Forbidden", { status: 403 });
}

// POST - Incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log incoming webhook for debugging
    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return NextResponse.json({ status: "ok" });
    }

    // Handle incoming messages
    const messages = value?.messages;
    if (messages && messages.length > 0) {
      for (const message of messages) {
        const from = message.from; // phone number
        const text = message?.text?.body || "";
        const messageId = message.id;

        console.log(`Incoming WhatsApp from ${from}: ${text}`);

        // Try to match to a case by phone number and save message
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            process.env.APP_BASE_URL ||
            "http://localhost:3000";

          await fetch(`${baseUrl}/api/cases/whatsapp-inbound`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from, text, messageId })
          });
        } catch (err) {
          console.error("Failed to process inbound WhatsApp message:", err);
        }
      }
    }

    // Handle message status updates
    const statuses = value?.statuses;
    if (statuses && statuses.length > 0) {
      for (const status of statuses) {
        console.log(`WhatsApp message ${status.id} status: ${status.status}`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 }); // Always 200 to Meta
  }
}
