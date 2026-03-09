import { NextResponse } from "next/server";
import { generateAdvisorResponse } from "@/lib/ai-advisor";

export async function POST(request: Request) {
  const { question, count } = (await request.json()) as { question: string; count: number };
  const result = generateAdvisorResponse(question, count);

  const answer = result.showConsultationCta
    ? `${result.guidance} Speak with a Newton Immigration Consultant for a personalized strategy.`
    : result.guidance;

  return NextResponse.json({ answer });
}
