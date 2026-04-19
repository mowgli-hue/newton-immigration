import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { question, count, history } = (await request.json()) as { 
    question: string; count: number; history?: {role:string;text:string}[] 
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: `You are Newton Immigration AI Advisor — a professional Canadian immigration consultant assistant for Newton Immigration Inc. based in Surrey, BC.

You help visitors understand:
- Express Entry (CRS scores, draws, CEC, FSW, FST)
- Provincial Nominee Programs (PNP) — BC PNP, Alberta, Ontario, Saskatchewan etc
- Work Permits (LMIA, PGWP, SOWP, BOWP, LMIA-exempt)
- Study Permits and post-graduation pathways
- Visitor Visas (TRV, Super Visa)
- Spousal Sponsorship and Family Class
- Canadian Citizenship
- PR pathways and timelines

RULES:
- Give specific, accurate, helpful answers based on current Canadian immigration law
- Always mention consulting a regulated consultant (RCIC) for personalized advice
- After 3 questions, suggest booking a consultation at newtonimmigration.com/consultation
- Keep responses concise (2-4 sentences max) and actionable
- Use current knowledge of IRCC policies and processing times
- Never make promises about outcomes

Newton Immigration: +1 778-723-6662 | newtonimmigration@gmail.com | Surrey, BC`,
        messages: [
          ...(history || []).slice(-6).map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text
          })),
          { role: "user", content: question }
        ]
      })
    });

    if (!res.ok) throw new Error("AI unavailable");
    const data = await res.json() as any;
    let answer = data.content?.[0]?.text || "Please contact our team for assistance.";

    if (count >= 3) {
      answer += "\n\n📞 Ready for a personalized strategy? **Book a free consultation** with our RCIC consultants at newtonimmigration.com/consultation";
    }

    return NextResponse.json({ answer });
  } catch(e) {
    return NextResponse.json({ 
      answer: "I'm having trouble connecting right now. Please call us at +1 778-723-6662 or email newtonimmigration@gmail.com for immediate assistance." 
    });
  }
}
