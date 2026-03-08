import { NextResponse } from "next/server";

type LeadPayload = {
  name?: string;
  email?: string;
  company?: string;
  challenge?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  page?: string;
};

function validateEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

export async function POST(req: Request) {
  const payload = (await req.json()) as LeadPayload;

  if (!payload.name || !payload.email || !payload.challenge) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!validateEmail(payload.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const lead = {
    ...payload,
    createdAt: new Date().toISOString(),
    source: "website_chatbot"
  };

  const webhook = process.env.LEAD_WEBHOOK_URL;

  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(lead)
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to forward lead" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
