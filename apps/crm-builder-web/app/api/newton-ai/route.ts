import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { listCases } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history } = await request.json();
    const cases = await listCases(user.companyId);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });

    const caseList = cases.slice(0, 50).map((c: any) => {
      const permitExpiry = (c.pgwpIntake as any)?.studyPermitExpiryDate || (c.pgwpIntake as any)?.workPermitExpiryDate || c.permitExpiryDate || "";
      const daysLeft = permitExpiry ? Math.floor((new Date(permitExpiry).getTime() - Date.now()) / 86400000) : null;
      return `${c.id}: ${c.client} | ${c.formType} | ${c.processingStatus || "docs_pending"} | ${c.assignedTo || "unassigned"}${c.isUrgent ? " | URGENT" : ""}${daysLeft !== null ? ` | permit expires ${daysLeft}d` : ""}`;
    }).join("\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are Newton, the AI assistant for Newton Immigration — a Canadian immigration consulting firm in Surrey, BC. Today: ${today}. Staff member: ${user.name} (${user.role}).

ACTIVE CASES (${cases.length}):
${caseList}

Help with: IRCC news, case analysis, letters (LOE, cover letters, employer letters), WhatsApp messages in English/Punjabi, document checklists, eligibility, processing times. For letters format them completely ready to use. Flag urgent items with 🚨.`,
        messages: [...(history || []), { role: "user", content: message }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }

    const data = await res.json() as any;
    const reply = data.content?.[0]?.text || "No response generated.";
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("Newton AI error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
