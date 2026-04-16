import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { listCases } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history, caseContext } = await request.json();
    const cases = await listCases(user.companyId);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });

    const caseList = cases.slice(0, 50).map((c: any) => {
      const intake = c.pgwpIntake || {};
      const permitExpiry = intake.studyPermitExpiryDate || intake.workPermitExpiryDate || c.permitExpiryDate || "";
      const daysLeft = permitExpiry ? Math.floor((new Date(permitExpiry).getTime() - Date.now()) / 86400000) : null;
      return `${c.id}: ${c.client} | ${c.formType} | ${c.processingStatus || "docs_pending"} | Assigned: ${c.assignedTo || "unassigned"} | Urgent: ${c.isUrgent ? "YES" : "no"}${daysLeft !== null ? ` | Permit expires in ${daysLeft} days` : ""}`;
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
        system: `You are Newton, the personal AI assistant for Newton Immigration — a Canadian immigration consulting firm in Surrey, BC.
Today: ${today}
Staff: ${user.name} (${user.role})

ACTIVE CASES (${cases.length} total):
${caseList}

You can help with:
- Latest IRCC news & policy updates
- Case analysis & urgent flags  
- Letters of explanation, cover letters, employer letters
- WhatsApp messages in English & Punjabi
- Document checklists for any application type
- Eligibility assessments
- Processing times

When generating letters, format them completely ready to use with proper date, recipient, subject, body, and signature.
When asked ANALYZE_CASES, review the case list for urgent items, expiring permits, and patterns.`,
        messages: [...(history || []), { role: "user", content: message }]
      })
    });

    const data = await res.json() as any;
    return NextResponse.json({ reply: data.content?.[0]?.text || "No response" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
