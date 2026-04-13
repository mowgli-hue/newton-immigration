// Smart WhatsApp auto-reply system
// 1. Replies automatically to common questions using case context + memory
// 2. Sends portal reminders to incomplete clients
// 3. Sends email reminders to team for stale cases

import { getCase, listCases, addMessage } from "@/lib/store";
import { sendWhatsAppText } from "@/lib/whatsapp";

const ESCALATE_AFTER_MS = 2 * 60 * 60 * 1000;
const COMPANY_ID = process.env.DEFAULT_COMPANY_ID || "newton";
const TEAM_EMAIL = "team.newtonimmigration@gmail.com";
const ADMIN_EMAIL = "newtonimmigration@gmail.com";

function detectIntent(text: string): string {
  const t = text.toLowerCase().trim();
  if (t.match(/status|update|progress|how.*applic|when.*approv|any.*news|check/)) return "status";
  if (t.match(/document|doc|upload|send|missing|need|require/)) return "documents";
  if (t.match(/approv|approved|result|decision|letter/)) return "result";
  if (t.match(/submitt|submitted|when.*submit|submit/)) return "submission";
  if (t.match(/hello|hi|hey|good morning|good afternoon|salam|sat sri|ssa/)) return "greeting";
  if (t.match(/thank|thanks|thankyou|thx|shukriya|dhanyavaad/)) return "thanks";
  if (t.match(/call|speak|talk|phone|contact|reach/)) return "contact";
  if (t.match(/how long|timeline|process.*time|wait|waiting/)) return "timeline";
  if (t.match(/cost|fee|price|charge|pay|payment/)) return "payment";
  if (t.match(/portal|link|login|access|website/)) return "portal";
  if (t.match(/cancel|refund|stop/)) return "cancel";
  if (t.match(/visa|stamp|passport|travel/)) return "travel";
  if (t.match(/work|job|employer|lmia|permit/)) return "work";
  if (t.match(/extension|extend|renew|expir/)) return "extension";
  return "unknown";
}

function buildReply(intent: string, clientName: string, caseData: any): string {
  const firstName = (clientName || "there").split(" ")[0];
  const formType = caseData?.formType || "your application";
  const stage = caseData?.processingStatus || "in progress";
  const appNum = caseData?.applicationNumber;

  switch (intent) {
    case "greeting":
      return `Hi ${firstName}! 👋\n\nWelcome to Newton Immigration. How can we help you today?\n\nਸਤ ਸ੍ਰੀ ਅਕਾਲ ${firstName} ਜੀ! ਅਸੀਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੇ ਹਾਂ?`;

    case "thanks":
      return `You're welcome ${firstName}! 😊 We're always here to help. Feel free to reach out anytime.\n\nਕੋਈ ਗੱਲ ਨਹੀਂ! ਜ਼ਰੂਰਤ ਪਵੇ ਤਾਂ ਦੱਸੋ। 🙏`;

    case "status":
      if (appNum && stage === "submitted") {
        return `Hi ${firstName}! 📋\n\nYour *${formType}* has been submitted to IRCC.\n*Application #:* ${appNum}\n\nIRCC is currently processing your file. We'll notify you immediately when we receive a decision. Processing times vary by application type.\n\nਤੁਹਾਡੀ ਅਰਜ਼ੀ IRCC ਨੂੰ ਭੇਜ ਦਿੱਤੀ ਗਈ ਹੈ। ਫ਼ੈਸਲਾ ਆਉਂਦੇ ਹੀ ਸੂਚਿਤ ਕਰਾਂਗੇ। 🙏`;
      }
      if (stage === "under_review") {
        return `Hi ${firstName}! 🔍\n\nYour *${formType}* is currently under review by our processing team. We're working on it and will update you soon.\n\nਤੁਹਾਡੀ ਫ਼ਾਈਲ ਸਾਡੀ ਟੀਮ ਰਿਵਿਊ ਕਰ ਰਹੀ ਹੈ।`;
      }
      if (stage === "docs_pending") {
        return `Hi ${firstName}! 📂\n\nYour *${formType}* is waiting for documents. Please check your portal and upload any missing documents so we can move your file forward.\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੋਰਟਲ ਚੈੱਕ ਕਰੋ ਅਤੇ ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼ ਅਪਲੋਡ ਕਰੋ।`;
      }
      return `Hi ${firstName}! 🙏\n\nYour *${formType}* is being processed by our team. We'll keep you updated. If you have specific questions, our team will follow up shortly.`;

    case "documents":
      return `Hi ${firstName}! 📎\n\nPlease upload your documents through your secure portal. If you haven't received your portal link, let us know and we'll resend it.\n\nIf you need help knowing which documents are required for your *${formType}*, our team will get back to you shortly.\n\nਆਪਣੇ ਦਸਤਾਵੇਜ਼ ਪੋਰਟਲ ਰਾਹੀਂ ਅਪਲੋਡ ਕਰੋ। 📂`;

    case "portal":
      return `Hi ${firstName}! 🔗\n\nYou can access your portal through the secure link we sent you via WhatsApp. If you can't find it, please let us know and we'll resend it right away.\n\nਤੁਹਾਡਾ ਪੋਰਟਲ ਲਿੰਕ ਦੁਬਾਰਾ ਭੇਜਣ ਲਈ ਦੱਸੋ।`;

    case "result":
      if (appNum) {
        return `Hi ${firstName}! 📬\n\nFor your *${formType}* (App # ${appNum}): We'll notify you as soon as IRCC makes a decision. Decisions are usually sent to your email and IRCC account.\n\nਫ਼ੈਸਲਾ ਆਉਂਦੇ ਹੀ ਤੁਹਾਨੂੰ ਦੱਸਾਂਗੇ। 🙏`;
      }
      return `Hi ${firstName}! We'll notify you as soon as we receive a decision from IRCC on your ${formType}. 📬`;

    case "timeline":
      return `Hi ${firstName}! ⏰\n\nProcessing times depend on the application type and IRCC workload. For *${formType}*, current processing times can be checked at ircc.canada.ca/english/information/times/index.asp\n\nOur team will keep you updated throughout the process. 🙏`;

    case "extension":
      return `Hi ${firstName}! 📋\n\nFor permit extensions, it's important to apply *before your current permit expires*. Our team is on it for your *${formType}*. If you have urgent concerns about your expiry date, please let us know immediately.\n\nਪਰਮਿਟ ਖਤਮ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਅਰਜ਼ੀ ਦੇਣੀ ਜ਼ਰੂਰੀ ਹੈ।`;

    case "payment":
      return `Hi ${firstName}! 💳\n\nFor payment questions, please contact our office directly. Our team will get back to you with the details for your *${formType}* file.`;

    case "contact":
      return `Hi ${firstName}! 📞\n\nYou can reach Newton Immigration at:\n📱 WhatsApp: This number\n📧 Email: newtonimmigration@gmail.com\n\nOur team will follow up with you shortly regarding your *${formType}*. 🙏`;

    default:
      return `Hi ${firstName}! 🙏\n\nThank you for reaching out to Newton Immigration. Our team has received your message and will get back to you shortly regarding your *${formType}*.\n\nਤੁਹਾਡਾ ਸੁਨੇਹਾ ਮਿਲ ਗਿਆ। ਸਾਡੀ ਟੀਮ ਜਲਦੀ ਤੁਹਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੇਗੀ।`;
  }
}

export async function handleSmartReply(params: {
  phone: string;
  message: string;
  companyId: string;
}): Promise<{ replied: boolean; intent: string }> {
  const { phone, message, companyId } = params;
  const intent = detectIntent(message);
  
  // Don't auto-reply to unknown — let team handle
  if (intent === "unknown") return { replied: false, intent };

  const cases = await listCases(companyId);
  const n = phone.replace(/\D/g, "");
  const matchedCase = cases.find(c => {
    const cp = (c.leadPhone || "").replace(/\D/g, "");
    return cp && (n.endsWith(cp) || cp.endsWith(n));
  });

  const clientName = matchedCase?.client || "";
  const reply = buildReply(intent, clientName, matchedCase);
  
  await sendWhatsAppText(n, reply);
  
  if (matchedCase) {
    await addMessage({
      companyId,
      caseId: matchedCase.id,
      senderType: "staff",
      senderName: "Newton AI",
      text: `[Auto-reply] ${reply.slice(0, 100)}...`,
      channel: "whatsapp"
    });
  }
  
  return { replied: true, intent };
}

// Send portal reminder to clients who haven't completed
export async function sendPortalReminder(params: {
  phone: string;
  clientName: string;
  formType: string;
  portalLink: string;
}): Promise<void> {
  const { phone, clientName, formType, portalLink } = params;
  const firstName = clientName.split(" ")[0];
  const message = `Hi ${firstName}! 👋\n\nWe noticed you opened your Newton Immigration portal but haven't completed your information yet for your *${formType}* application.\n\nIt only takes *5 minutes* — your file cannot move forward until it's done. ⚠️\n\nPlease complete it here:\n${portalLink}\n\nIf you need help, just reply to this message. 🙏\n\nਤੁਸੀਂ ਪੋਰਟਲ ਖੋਲ੍ਹਿਆ ਸੀ ਪਰ ਜਾਣਕਾਰੀ ਭਰੀ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਉੱਪਰ ਦਿੱਤੀ ਲਿੰਕ ਤੋਂ ਪੂਰਾ ਕਰੋ।`;
  await sendWhatsAppText(phone.replace(/\D/g, ""), message);
}

// Send email reminder to team for stale cases
export async function sendStaleEmailReminder(staleCases: Array<{
  id: string;
  client: string;
  formType: string;
  assignedTo: string;
  daysSinceUpdate: number;
}>): Promise<void> {
  if (!staleCases.length) return;
  
  const rows = staleCases.map(c => 
    `• ${c.client} | ${c.id} | ${c.formType} | Assigned: ${c.assignedTo || "Unassigned"} | Last update: ${c.daysSinceUpdate} days ago`
  ).join("\n");

  const body = `Hi Newton Team,\n\nThe following cases have had no updates for 7+ days and may need attention:\n\n${rows}\n\nPlease review and update the status for each case.\n\nThis is an automated reminder from Newton CRM.\n\n— Newton Immigration System`;

  // Use email API if configured, otherwise log
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY || ""}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Newton CRM <noreply@newtonimmigration.ca>",
        to: [TEAM_EMAIL, ADMIN_EMAIL],
        subject: `⚠️ ${staleCases.length} cases need attention — Newton CRM`,
        text: body
      })
    });
    console.log(`✅ Stale case email sent to ${TEAM_EMAIL}`);
  } catch (e) {
    console.error("Email send failed:", (e as Error).message);
    // Fallback — send via WhatsApp to team number if available
    const teamPhone = process.env.TEAM_WHATSAPP_PHONE;
    if (teamPhone) {
      await sendWhatsAppText(teamPhone, `⚠️ Newton CRM Alert:\n\n${staleCases.length} cases need attention:\n\n${staleCases.slice(0,5).map(c => `• ${c.client} (${c.id}) — ${c.daysSinceUpdate}d`).join("\n")}\n\nCheck CRM for details.`);
    }
  }
}
