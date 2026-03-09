import { NextResponse } from "next/server";

const assessments: Array<Record<string, unknown>> = [];

export async function POST(request: Request) {
  const payload = await request.json();
  assessments.push({ ...payload, createdAt: new Date().toISOString() });

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "assessment", ...payload })
    });
  }

  return NextResponse.json({ ok: true, stored: assessments.length });
}
