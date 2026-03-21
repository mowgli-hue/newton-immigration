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
    // TODO: wire Twilio SMS provider when credentials are supplied.
    return { ok: false, status: "failed", provider: "twilio_sms", detail: "Twilio SMS scaffolded but not enabled yet" };
  }

  if (input.channel === "whatsapp") {
    if (!hasWhatsAppProvider()) {
      return { ok: false, status: "provider_missing", provider: "whatsapp_cloud" };
    }
    // TODO: wire WhatsApp Cloud API provider when credentials are supplied.
    return { ok: false, status: "failed", provider: "whatsapp_cloud", detail: "WhatsApp scaffolded but not enabled yet" };
  }

  return { ok: false, status: "failed", provider: "none", detail: "Unsupported channel" };
}

