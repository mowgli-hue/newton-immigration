import { config } from '../../infrastructure/config/env';

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type EmailDeliveryResult = { provider: 'console' | 'resend'; accepted: true };

async function sendWithResend(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const from = config.emailFrom;
  const apiKey = config.resendApiKey;
  if (!from || !apiKey) {
    throw new Error('Resend configuration missing');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      reply_to: config.emailReplyTo || undefined
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Resend email failed (${response.status}) ${details}`);
  }

  return { provider: 'resend', accepted: true };
}

export async function sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  if (config.resendApiKey && config.emailFrom) {
    return sendWithResend(payload);
  }

  // Fallback for local/dev environments.
  console.log('[email:console]', JSON.stringify(payload, null, 2));
  return { provider: 'console', accepted: true };
}
