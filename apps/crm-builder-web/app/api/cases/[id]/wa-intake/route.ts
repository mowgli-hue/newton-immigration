import { NextRequest, NextResponse } from "next/server";
import { getQuestionFlowForFormType } from "@/lib/application-question-flows";
import { resolveApplicationChecklistKey } from "@/lib/application-checklists";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { getCurrentUserFromRequest } = await import("@/lib/auth");
    const { getCase, updateCaseProcessing } = await import("@/lib/store");
    const { sendWhatsAppText, sendWhatsAppTemplate } = await import("@/lib/whatsapp");

    let companyId = "newton";
    try {
      const user = await getCurrentUserFromRequest(request);
      if (user) companyId = user.companyId;
    } catch { /* allow system calls */ }

    const caseItem = await getCase(companyId, params.id);
    if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const phone = String(caseItem.leadPhone || "").replace(/\D/g, "");
    if (!phone) return NextResponse.json({ error: "No phone number on this case" }, { status: 400 });

    const firstName = String(caseItem.client || "there").split(" ")[0];
    const checklistKey = resolveApplicationChecklistKey(caseItem.formType);
    const flow = getQuestionFlowForFormType(caseItem.formType); // pass raw formType, not already-resolved key
    console.log(`📱 WA Intake: ${caseItem.client} | formType: ${caseItem.formType} | key: ${checklistKey} | questions: ${flow?.prompts?.length} | phone: ${phone}`);
    const questions = flow?.prompts?.length ? flow.prompts : [
      "What is your full legal name as it appears on your passport?",
      "What is your current status in Canada and when does it expire?",
      "What is your current address? (Street, City, Province, Postal Code)",
      "What is your marital status? (Single / Married / Common-Law / Divorced)",
      "Please describe your employment in the last 3 years (employer, job title, dates)",
      "Have you ever been refused a visa or permit to any country? (Yes/No — if Yes, explain)",
      "Do you have any criminal history? (Yes/No)",
      "Any medical conditions we should be aware of? (Yes/No — if Yes, describe)",
    ];

    // Build numbered question list
    const questionList = questions.map((q, i) => `*${i + 1}.* ${q}`).join("\n\n");

    // Message 1: Greeting via approved template
    const templateResult = await sendWhatsAppTemplate({
      to: phone,
      templateName: "newton_immigration_intake",
      languageCode: "en",
      components: [{
        type: "body",
        parameters: [
          { type: "text", text: firstName },
          { type: "text", text: caseItem.formType }
        ]
      }]
    });
    if (!templateResult.success) {
      await sendWhatsAppText(phone, `Hi ${firstName}! Welcome to Newton Immigration. Thank you for choosing us for your ${caseItem.formType} application. Our team will guide you through every step.`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Message 2: Questions checklist
    const checklistMsg = [
      `📋 *To prepare your application, please answer the following questions.*`,
      ``,
      `Reply with all answers numbered in *ONE message* like:`,
      `1. your answer`,
      `2. your answer`,
      `3. your answer...`,
      ``,
      `━━━━━━━━━━━━━━━`,
      questionList,
      `━━━━━━━━━━━━━━━`,
      ``,
      `Take your time and reply with all answers together. We will take care of the rest! 🙏`,
    ].join("\n");

    await sendWhatsAppText(phone, checklistMsg);

    // Save session — set phase to "awaiting_bulk" so intake handler knows to parse bulk reply
    await updateCaseProcessing(companyId, params.id, {
      pgwpIntake: {
        ...((caseItem.pgwpIntake as Record<string, string>) || {}),
        whatsappSession: JSON.stringify({
          caseId: params.id,
          companyId,
          phone,
          clientName: caseItem.client,
          formType: caseItem.formType,
          questions,
          answers: {},
          phase: "awaiting_bulk"
        })
      }
    } as any);

    return NextResponse.json({ ok: true, message: `WhatsApp intake started for ${caseItem.client}` });
  } catch (e) {
    console.error("wa-intake error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
