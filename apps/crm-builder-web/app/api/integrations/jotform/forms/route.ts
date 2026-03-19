import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";

type JotformForm = {
  id?: string;
  title?: string;
  url?: string;
  count?: number;
  created_at?: string;
  updated_at?: string;
};

type JotformEnvelope<T> = {
  responseCode?: number;
  message?: string;
  content?: T;
};

const JOTFORM_BASE = (process.env.JOTFORM_BASE_URL || "https://api.jotform.com").replace(/\/$/, "");

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.JOTFORM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing JOTFORM_API_KEY in crm-builder-web env." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${JOTFORM_BASE}/user/forms?apiKey=${encodeURIComponent(apiKey)}`, {
      cache: "no-store"
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Jotform request failed (${res.status})` }, { status: 502 });
    }

    const body = (await res.json()) as JotformEnvelope<JotformForm[]>;
    const forms = (body.content || []).map((f) => ({
      id: String(f.id || ""),
      title: String(f.title || "Untitled form"),
      url: String(f.url || "")
    }));

    return NextResponse.json({ forms });
  } catch {
    return NextResponse.json({ error: "Could not reach Jotform API" }, { status: 502 });
  }
}
