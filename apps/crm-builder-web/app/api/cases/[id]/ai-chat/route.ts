import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCase } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { message, history } = await request.json();
    const caseItem = await getCase(user.companyId, params.id);
    if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: `You are an AI assistant for Newton Immigration. Help staff with case ${params.id} for client ${caseItem.client} applying for ${caseItem.formType}. Stage: ${caseItem.stage}. Status: ${caseItem.processingStatus || "docs_pending"}. Assigned to: ${caseItem.assignedTo || "unassigned"}. Be concise and focus on Canadian immigration law and IRCC procedures.`,
        messages: [...(history || []), { role: "user", content: message }]
      })
    });

    const data = await res.json() as any;
    return NextResponse.json({ reply: data.content?.[0]?.text || "No response" });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
