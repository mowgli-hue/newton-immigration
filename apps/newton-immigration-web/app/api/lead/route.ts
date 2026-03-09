import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const webhook = process.env.LEAD_WEBHOOK_URL;

  if (!webhook) {
    return NextResponse.json({ ok: false, error: "LEAD_WEBHOOK_URL is not configured" }, { status: 500 });
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "Webhook delivery failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
