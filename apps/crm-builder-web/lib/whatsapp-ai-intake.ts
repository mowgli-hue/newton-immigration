// lib/whatsapp-ai-intake.ts
// WhatsApp AI intake — asks application-specific questions only

import { getQuestionFlowForFormType } from "@/lib/application-question-flows";
import { resolveApplicationChecklistKey } from "@/lib/application-checklists";
import { sendWhatsAppText, sendWhatsAppTemplate, sendDocumentChecklist } from "@/lib/whatsapp";
import { getCase, updateCaseProcessing, addMessage } from "@/lib/store";

export type IntakeSession = {
  caseId: string;
  companyId: string;
  phone: string;
  clientName: string;
  formType: string;
  questions: string[];
  currentIndex: number;
  answers: Record<string, string>;
  phase: "intake" | "awaiting_bulk" | "complete";
};

// DB-backed session store — persists across redeploys
// Sessions stored in case.pgwpIntake.whatsappSession as JSON

export async function getActiveSession(phone: string, companyId?: string) {
  return getSession(phone, companyId);
}

export async function getSession(phone: string, companyId?: string): Promise<IntakeSession | undefined> {
  try {
    const { listCases } = await import("@/lib/store");
    const cId = companyId || process.env.DEFAULT_COMPANY_ID || "newton";
    const cases = await listCases(cId);
    const n = phone.replace(/\D/g, "");
    const matched = cases.find((c) => {
      const cp = (c.leadPhone || "").replace(/\D/g, "");
      return cp && (n.endsWith(cp) || cp.endsWith(n));
    });
    if (!matched?.pgwpIntake) return undefined;
    const raw = (matched.pgwpIntake as Record<string, string>).whatsappSession;
    if (!raw) return undefined;
    return JSON.parse(raw) as IntakeSession;
  } catch { return undefined; }
}

export async function setSession(phone: string, session: IntakeSession): Promise<void> {
  try {
    const { getCase, updateCaseProcessing } = await import("@/lib/store");
    const caseItem = await getCase(session.companyId, session.caseId);
    if (!caseItem) return;
    await updateCaseProcessing(session.companyId, session.caseId, {
      pgwpIntake: {
        ...((caseItem.pgwpIntake as Record<string, string>) || {}),
        whatsappSession: JSON.stringify(session)
      }
    });
  } catch (e) { console.error("setSession error:", e); }
}

export async function clearSession(phone: string, companyId: string, caseId: string): Promise<void> {
  try {
    const { getCase, updateCaseProcessing } = await import("@/lib/store");
    const caseItem = await getCase(companyId, caseId);
    if (!caseItem) return;
    const intake = { ...((caseItem.pgwpIntake as Record<string, string>) || {}) };
    delete intake.whatsappSession;
    await updateCaseProcessing(companyId, caseId, { pgwpIntake: intake });
  } catch { /**/ }
}

// Called when a new case is created
export async function startIntakeSession(params: {
  caseId: string;
  companyId: string;
  clientName: string;
  phone: string;
  formType: string;
}): Promise<{ success: boolean; error?: string }> {
  const { caseId, companyId, clientName, phone, formType } = params;

  const flow = getQuestionFlowForFormType(formType);
  const questions = flow.prompts;

  if (questions.length === 0) {
    console.log(`No specific questions for ${formType} — skipping intake`);
    return { success: true };
  }

  const session: IntakeSession = {
    caseId,
    companyId,
    phone,
    clientName,
    formType,
    questions,
    currentIndex: 0,
    answers: {},
    phase: "intake"
  };

  // Set phase to awaiting_bulk — client replies with all answers at once
  session.phase = "awaiting_bulk";
  await setSession(phone, session);

  const firstName = clientName.split(" ")[0];
  const questionList = questions.map((q: string, i: number) => `*${i + 1}.* ${q}`).join("\n\n");

  // Message 1: Greeting
  const greetingMsg = [
    `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${firstName} ਜੀ! 🙏`,
    `Hi ${firstName}! Welcome to *Newton Immigration*.`,
    ``,
    `Thank you for choosing us for your *${formType}* application. We are excited to work with you and will make this process as smooth as possible.`,
    ``,
    `Our team will be guiding you through every step. Please feel free to reach out anytime if you have questions.`,
    ``,
    `— Newton Immigration Team 🍁`,
  ].join("\n");

  await sendWhatsAppText(phone, greetingMsg);

  // Small delay between messages
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

  return sendWhatsAppText(phone, checklistMsg);
}

// Handle incoming reply from client
export async function handleIncomingReply(params: {
  phone: string;
  message: string;
  companyId?: string;
}): Promise<void> {
  const { phone, message, companyId } = params;
  const session = await getSession(phone, companyId);

  if (!session) {
    console.log(`No active session for ${phone} — message ignored`);
    return;
  }

  // ── Bulk reply mode (one message with all answers) ──────────────
  if (session.phase === "awaiting_bulk") {
    const parsed = parseBulkAnswers(message, session.questions);
    session.answers = parsed;
    session.currentIndex = session.questions.length;
    session.phase = "complete";
    await saveAnswersToCRM(session);
    await setSession(phone, session);
    await completeIntake(session);
    return;
  }

  // ── One-by-one mode (legacy fallback) ───────────────────────────
  const currentQ = session.questions[session.currentIndex];
  if (currentQ) {
    session.answers[currentQ] = message.trim();
    session.currentIndex++;
  }
  await saveAnswersToCRM(session);
  if (session.currentIndex < session.questions.length) {
    await setSession(phone, session);
    await sendNextQuestion(session);
  } else {
    session.phase = "complete";
    await setSession(phone, session);
    await completeIntake(session);
  }
}

// Parse bulk reply like "1. answer\n2. answer\n3. answer"
function parseBulkAnswers(message: string, questions: string[]): Record<string, string> {
  const answers: Record<string, string> = {};

  // Split by lines starting with a number + dot/paren
  const lines = message.split("\n");
  let currentNum = -1;
  let currentAnswer = "";

  const flush = () => {
    if (currentNum >= 0 && currentNum < questions.length && currentAnswer.trim()) {
      answers[questions[currentNum]] = currentAnswer.trim();
    }
  };

  for (const line of lines) {
    const numMatch = line.match(/^\s*(\d+)[.):]\s*(.*)/);
    if (numMatch) {
      flush();
      currentNum = parseInt(numMatch[1]) - 1;
      currentAnswer = numMatch[2] || "";
    } else if (currentNum >= 0) {
      currentAnswer += " " + line.trim();
    }
  }
  flush();

  // Fill any unanswered questions with empty string
  questions.forEach(q => { if (!answers[q]) answers[q] = ""; });

  return answers;
}

async function sendNextQuestion(session: IntakeSession): Promise<void> {
  const q = session.questions[session.currentIndex];
  if (!q) return;

  const total = session.questions.length;
  const num = session.currentIndex + 1;

  const msg = `*Question ${num} of ${total}:*
${q}`;

  await sendWhatsAppText(session.phone, msg);
}

async function saveAnswersToCRM(session: IntakeSession): Promise<void> {
  try {
    const caseItem = await getCase(session.companyId, session.caseId);
    if (!caseItem) return;

    await updateCaseProcessing(session.companyId, session.caseId, {
      pgwpIntake: {
        ...((caseItem.pgwpIntake as Record<string, string>) || {}),
        applicationSpecificAnswers: JSON.stringify(session.answers),
        whatsappIntakeProgress: `${session.currentIndex}/${session.questions.length}`,
        whatsappIntakePhase: session.phase
      }
    });

    // Log to case messages
    const latestQ = session.questions[session.currentIndex - 1];
    const latestA = session.answers[latestQ] || "";
    if (latestQ && latestA) {
      await addMessage({
        companyId: session.companyId,
        caseId: session.caseId,
        senderName: session.clientName,
        senderType: "client",
        text: `[WhatsApp] Q: ${latestQ}\nA: ${latestA}`
      });
    }
  } catch (err) {
    console.error("Failed to save answers to CRM:", err);
  }
}

async function completeIntake(session: IntakeSession): Promise<void> {
  try {
    // Mark case as intake complete
    const caseItem = await getCase(session.companyId, session.caseId);
    if (caseItem) {
      await updateCaseProcessing(session.companyId, session.caseId, {
        pgwpIntake: {
          ...((caseItem.pgwpIntake as Record<string, string>) || {}),
          applicationSpecificAnswers: JSON.stringify(session.answers),
          whatsappIntakePhase: "complete",
          whatsappIntakeCompletedAt: new Date().toISOString()
        },
        aiStatus: "intake_complete"
      });
    }

    // Get document checklist
    const checklistKey = resolveApplicationChecklistKey(session.formType);
    const { APPLICATION_CHECKLISTS } = await import("@/lib/application-checklists");
    const checklist = (APPLICATION_CHECKLISTS as Record<string, Array<{ required: boolean; label: string }>>)[checklistKey] || [];
    const requiredDocs = checklist
      .filter((item) => item.required)
      .map((item) => item.label);

    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://junglecrm-builder-web-production-d358.up.railway.app"}/questionnaire/${session.caseId}`;

    // Send checklist to client
    await sendDocumentChecklist({
      clientName: session.clientName,
      phone: session.phone,
      checklistItems: requiredDocs,
      portalUrl
    });

    clearSession(session.phone);
    console.log(`✅ WhatsApp intake complete for case ${session.caseId}`);

    // Auto-generate IRCC form if applicable (IMM5710 for PGWP/OWP/SOWP etc)
    try {
      const imm5710Types = ["pgwp", "owp", "sowp", "bowp", "vowp", "open work permit", "work permit", "restoration"];
      const ft = session.formType.toLowerCase();
      const needsForm = imm5710Types.some(t => ft.includes(t));
      if (needsForm) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "https://junglecrm-builder-web-production-d358.up.railway.app";
        const res = await fetch(`${appUrl}/api/cases/${session.caseId}/generate-forms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemToken: process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024" })
        });
        if (res.ok) {
          const d = await res.json();
          console.log(`📄 Auto-generated forms for ${session.caseId}:`, d.generated);
          // Notify client their form is being prepared
          await sendWhatsAppText(session.phone,
            `✅ Thank you ${session.clientName.split(" ")[0]}! Your information has been saved and your application form is being prepared automatically. Our team will review everything and be in touch soon. — Newton Immigration 🙏`
          );
        }
      }
    } catch (e) {
      console.error("Auto-generate form error:", (e as Error).message);
    }
  } catch (err) {
    console.error("Error completing intake:", err);
  }
}
