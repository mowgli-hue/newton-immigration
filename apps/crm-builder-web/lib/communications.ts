export type DispatchChannel = "email" | "sms" | "whatsapp";

export type DispatchResult = {
  ok: boolean;
  status: "sent" | "provider_missing" | "failed";
  provider: string;
  detail?: string;
};

function hasEmailProvider() {
  return (
    String(process.env.SMTP_HOST || "").trim().length > 0 &&
    String(process.env.SMTP_USER || "").trim().length > 0 &&
    String(process.env.SMTP_PASS || "").trim().length > 0 &&
    String(process.env.SMTP_FROM || "").trim().length > 0
  );
}

function hasTwilioSmsProvider() {
  return (
    String(process.env.TWILIO_ACCOUNT_SID || "").trim().length > 0 &&
    String(process.env.TWILIO_AUTH_TOKEN || "").trim().length > 0 &&
    String(process.env.TWILIO_FROM_NUMBER || "").trim().length > 0
  );
}

function hasWhatsAppProvider() {
  return (
    String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim().length > 0 &&
    String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim().length > 0
  );
}

function useMockSend() {
  return String(process.env.COMMS_MOCK_SEND || "").toLowerCase() === "true";
}

function normalizePhoneDigits(target: string) {
  return String(target || "").replace(/[^\d]/g, "");
}

async function sendViaTwilioSms(target: string, message: string): Promise<DispatchResult> {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from = String(process.env.TWILIO_FROM_NUMBER || "").trim();
  const to = target.startsWith("+") ? target : `+${normalizePhoneDigits(target)}`;
  if (!accountSid || !authToken || !from) {
    return { ok: false, status: "provider_missing", provider: "twilio_sms" };
  }
  try {
    const body = new URLSearchParams();
    body.set("To", to);
    body.set("From", from);
    body.set("Body", message);
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, status: "failed", provider: "twilio_sms", detail: `Twilio ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { ok: true, status: "sent", provider: "twilio_sms" };
  } catch (e) {
    return { ok: false, status: "failed", provider: "twilio_sms", detail: String((e as Error)?.message || e) };
  }
}

async function sendViaWhatsAppCloud(target: string, message: string): Promise<DispatchResult> {
  const token = String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const to = normalizePhoneDigits(target);
  if (!token || !phoneNumberId) {
    return { ok: false, status: "provider_missing", provider: "whatsapp_cloud" };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      })
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, status: "failed", provider: "whatsapp_cloud", detail: `WhatsApp ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { ok: true, status: "sent", provider: "whatsapp_cloud" };
  } catch (e) {
    return { ok: false, status: "failed", provider: "whatsapp_cloud", detail: String((e as Error)?.message || e) };
  }
}

// Provider-ready dispatch. Real provider calls can be plugged in without changing API/UI contract.
export async function dispatchCommunication(input: {
  channel: DispatchChannel;
  target: string;
  message: string;
}): Promise<DispatchResult> {
  const target = String(input.target || "").trim();
  const message = String(input.message || "").trim();
  if (!target || !message) {
    return { ok: false, status: "failed", provider: "none", detail: "target and message are required" };
  }

  if (useMockSend()) {
    return { ok: true, status: "sent", provider: "mock" };
  }

  if (input.channel === "email") {
    if (!hasEmailProvider()) {
      return { ok: false, status: "provider_missing", provider: "smtp" };
    }
    // TODO: wire SMTP provider when credentials are supplied.
    return { ok: false, status: "failed", provider: "smtp", detail: "SMTP integration scaffolded but not enabled yet" };
  }

  if (input.channel === "sms") {
    if (!hasTwilioSmsProvider()) {
      return { ok: false, status: "provider_missing", provider: "twilio_sms" };
    }
    return sendViaTwilioSms(target, message);
  }

  if (input.channel === "whatsapp") {
    if (!hasWhatsAppProvider()) {
      return { ok: false, status: "provider_missing", provider: "whatsapp_cloud" };
    }
    return sendViaWhatsAppCloud(target, message);
  }

  return { ok: false, status: "failed", provider: "none", detail: "Unsupported channel" };
}
