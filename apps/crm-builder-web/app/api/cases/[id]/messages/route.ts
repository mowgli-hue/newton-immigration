import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { maybeAutoRunImm5710 } from "@/lib/imm5710-runner";
import { IMM5710_CORE_QUESTIONS, getMissingImm5710Questions, getNextPgwpChatQuestion, validateIntakeAnswer } from "@/lib/imm5710";
import { buildReadyPackage, writeReadyPackageToDisk } from "@/lib/ready-package";
import {
  addMessage,
  getCase,
  listDocuments,
  listMessages,
  resolveUserFromInviteToken,
  syncCaseAutomation,
  updateCaseImm5710Automation,
  updateCasePgwpIntake
} from "@/lib/store";

function buildAiReply(input: {
  clientName: string;
  formType: string;
  text: string;
  docCount: number;
  missingDocCount: number;
  caseStage: string;
  missingIntakeLabels: string[];
  requesterType: "client" | "staff";
}) {
  const q = input.text.toLowerCase();
  if (input.missingIntakeLabels.length > 0) {
    const top = input.missingIntakeLabels.slice(0, 3).join(", ");
    if (input.requesterType === "staff") {
      return `IMM5710 is missing required answers: ${top}. Please collect and update these in Questions/Intake. I created team tasks for missing fields.`;
    }
    return `To continue your application, please complete these missing answers first: ${top}. Open the Questions section and submit them, then I will continue.`;
  }
  if (q.includes("document") || q.includes("upload")) {
    return `For ${input.formType}, please upload required docs in Documents tab. I currently see ${input.docCount} uploaded and ${input.missingDocCount} pending items.`;
  }
  if (q.includes("status") || q.includes("update")) {
    return `Current case stage is ${input.caseStage}. After all required docs are uploaded and reviewed, we move to READY and then submission.`;
  }
  if (q.includes("payment") || q.includes("fee")) {
    return "Please complete Interac payment and share confirmation screenshot. Team will mark payment as received and unlock all next steps.";
  }
  if (q.includes("passport") || q.includes("permit")) {
    return "Upload clear passport pages and study permit copy. Team extracts technical IMM5710 fields from these documents.";
  }
  return `Thanks ${input.clientName || "there"}. I can help with document checklist, case status, and next PGWP steps. Ask me what to upload next or your current status.`;
}

function looksLikePlainQuestion(text: string) {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (t.includes("?")) return true;
  return ["hi", "hello", "hey", "ok", "thanks", "thank you", "status"].includes(t);
}

async function getOpenAiReply(input: {
  clientName: string;
  formType: string;
  userText: string;
  contextHint: string;
}): Promise<string | null> {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an immigration case assistant for Newton Immigration. Be concise, practical, and ask one clear next question when information is missing."
          },
          {
            role: "user",
            content: [
              `Client: ${input.clientName || "Client"}`,
              `Application: ${input.formType}`,
              `Context: ${input.contextHint}`,
              `Message: ${input.userText}`
            ].join("\n")
          }
        ]
      })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const text = String(body?.choices?.[0]?.message?.content || "").trim();
    return text || null;
  } catch {
    return null;
  }
}

async function resolveRequestUser(request: NextRequest, caseId: string) {
  const user = await getCurrentUserFromRequest(request);
  if (user) return user;

  const inviteToken =
    String(request.nextUrl.searchParams.get("t") || "").trim() ||
    String(request.headers.get("x-client-invite-token") || "").trim();
  if (!inviteToken) return null;
  return resolveUserFromInviteToken(inviteToken, caseId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await resolveRequestUser(request, params.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff" && !canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await listMessages(user.companyId, params.id);
  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await resolveRequestUser(request, params.id);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (user.userType === "client" && user.caseId !== caseItem.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.userType === "staff" && !canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  const mode = String(body.mode ?? "human");

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const senderType = user.userType === "client" ? "client" : "staff";
  const senderName = user.name;
  const message = await addMessage({
    companyId: user.companyId,
    caseId: params.id,
    senderType,
    senderName,
    text
  });

  const shouldAiReply = mode === "ai" || user.userType === "client";
  if (shouldAiReply) {
    let liveCase = await getCase(user.companyId, params.id);
    if (!liveCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    const formType = String(liveCase.formType || "").toLowerCase();
    const isPgwpCase = formType.includes("pgwp") || formType.includes("imm5710");

    if (isPgwpCase && user.userType === "client") {
      const nextQuestion = getNextPgwpChatQuestion(liveCase.pgwpIntake);
      if (nextQuestion && !looksLikePlainQuestion(text)) {
        const validation = validateIntakeAnswer(nextQuestion.key, text);
        if (validation.ok) {
          await updateCasePgwpIntake(user.companyId, liveCase.id, {
            [nextQuestion.key]: validation.normalized
          });
          await syncCaseAutomation(user.companyId, liveCase.id);
          liveCase = await getCase(user.companyId, params.id);
          if (!liveCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
        } else {
          const aiMessage = await addMessage({
            companyId: user.companyId,
            caseId: params.id,
            senderType: "ai",
            senderName: "FlowDesk AI",
            text: `${validation.error} ${nextQuestion.prompt}${nextQuestion.formatHint ? ` ${nextQuestion.formatHint}` : ""}`
          });
          return NextResponse.json({ message, aiMessage }, { status: 201 });
        }
      }
    }

    await syncCaseAutomation(user.companyId, params.id);
    liveCase = await getCase(user.companyId, params.id);
    if (!liveCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });
    const docs = await listDocuments(user.companyId, params.id);
    const missingIntake = getMissingImm5710Questions(liveCase.pgwpIntake);
    const nextQuestion = getNextPgwpChatQuestion(liveCase.pgwpIntake);

    const readySnapshot = buildReadyPackage(liveCase, docs);
    let autoReadyPath = "";
    let autoRunNote = "";
    if (readySnapshot.readyPackage.readiness.readyForHumanReview) {
      autoReadyPath = await writeReadyPackageToDisk(liveCase.id, readySnapshot.readyPackage);
      const run = maybeAutoRunImm5710(liveCase, autoReadyPath);
      if (run.started) {
        await updateCaseImm5710Automation(user.companyId, liveCase.id, {
          status: "started",
          startedAt: new Date().toISOString(),
          pid: run.pid,
          logPath: run.logPath,
          readyPackagePath: autoReadyPath,
          autoTriggered: true,
          lastError: undefined
        });
        autoRunNote = ` IMM5710 automation started automatically (PID ${String(run.pid || "N/A")}).`;
      } else if (run.error) {
        await updateCaseImm5710Automation(user.companyId, liveCase.id, {
          status: "failed",
          readyPackagePath: autoReadyPath,
          lastError: run.error,
          autoTriggered: true
        });
        autoRunNote = ` Auto-run blocked: ${run.error}`;
      }
    }

    let aiReplyText = buildAiReply({
      clientName: liveCase.client,
      formType: liveCase.formType,
      text,
      docCount: docs.length,
      missingDocCount: docs.filter((d) => d.status !== "received").length,
      caseStage: liveCase.stage,
      missingIntakeLabels: missingIntake.map((f) => f.label),
      requesterType: user.userType
    });

    if (isPgwpCase && nextQuestion) {
      const total = IMM5710_CORE_QUESTIONS.length;
      const answered = total - Math.min(missingIntake.length, total);
      aiReplyText = `PGWP intake progress: ${answered}/${total}. ${nextQuestion.prompt}${nextQuestion.formatHint ? ` ${nextQuestion.formatHint}` : ""}`;
    } else if (readySnapshot.readyPackage.readiness.readyForHumanReview) {
      aiReplyText =
        `Great. PGWP intake + required docs are complete. I generated draft mapping and precheck package for human review.` +
        (autoReadyPath ? ` Ready package: ${autoReadyPath}` : "") +
        autoRunNote;
    } else {
      const contextHint = `Stage=${liveCase.stage}; Missing intake fields=${missingIntake
        .map((f) => f.label)
        .slice(0, 8)
        .join(", ") || "none"}`;
      const llmReply = await getOpenAiReply({
        clientName: liveCase.client,
        formType: liveCase.formType,
        userText: text,
        contextHint
      });
      if (llmReply) aiReplyText = llmReply;
    }

    const aiMessage = await addMessage({
      companyId: user.companyId,
      caseId: params.id,
      senderType: "ai",
      senderName: "FlowDesk AI",
      text: aiReplyText
    });
    return NextResponse.json({ message, aiMessage }, { status: 201 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
