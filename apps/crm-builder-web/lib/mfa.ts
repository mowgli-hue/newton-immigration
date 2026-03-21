import { createHmac, randomBytes } from "node:crypto";

type PreAuthPayload = {
  userId: string;
  companyId: string;
  purpose: "mfa_setup" | "mfa_login" | "mfa_enable";
  exp: number;
  nonce: string;
  secret?: string;
};

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64");
}

function getTokenSecret() {
  const secret =
    String(process.env.MFA_TOKEN_SECRET || "").trim() ||
    String(process.env.SESSION_TOKEN_SECRET || "").trim() ||
    String(process.env.NEXTAUTH_SECRET || "").trim();
  if (!secret) {
    // Development fallback only; set MFA_TOKEN_SECRET in production.
    return "dev-fallback-mfa-token-secret-change-me";
  }
  return secret;
}

export function createPreAuthToken(payload: Omit<PreAuthPayload, "exp" | "nonce"> & { ttlSeconds?: number }) {
  const ttlSeconds = Math.max(60, Number(payload.ttlSeconds || 600));
  const body: PreAuthPayload = {
    userId: payload.userId,
    companyId: payload.companyId,
    purpose: payload.purpose,
    secret: payload.secret,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: randomBytes(12).toString("hex")
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const sig = createHmac("sha256", getTokenSecret()).update(encodedPayload).digest();
  return `${encodedPayload}.${base64UrlEncode(sig)}`;
}

export function verifyPreAuthToken(token: string): PreAuthPayload | null {
  const value = String(token || "").trim();
  if (!value || !value.includes(".")) return null;
  const [payloadPart, sigPart] = value.split(".", 2);
  if (!payloadPart || !sigPart) return null;
  const expected = createHmac("sha256", getTokenSecret()).update(payloadPart).digest();
  const actual = base64UrlDecode(sigPart);
  if (expected.length !== actual.length) return null;
  let valid = 0;
  for (let i = 0; i < expected.length; i += 1) {
    valid |= expected[i] ^ actual[i];
  }
  if (valid !== 0) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8")) as PreAuthPayload;
    if (!payload?.userId || !payload?.companyId || !payload?.purpose || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function generateMfaSecret(bytes = 20) {
  return toBase32(randomBytes(Math.max(10, bytes)));
}

function toBase32(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(input: string) {
  const clean = String(input || "").toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number, digits = 6) {
  const key = fromBase32(secret);
  const buf = Buffer.alloc(8);
  const c = Math.floor(counter);
  buf.writeUInt32BE(Math.floor(c / 0x100000000), 0);
  buf.writeUInt32BE(c >>> 0, 4);
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(code).padStart(digits, "0");
}

export function verifyTotp(secret: string, code: string, options?: { stepSeconds?: number; window?: number; digits?: number }) {
  const stepSeconds = Math.max(15, Number(options?.stepSeconds || 30));
  const window = Math.max(0, Number(options?.window || 1));
  const digits = Math.max(6, Number(options?.digits || 6));
  const normalizedCode = String(code || "").trim().replace(/\s+/g, "");
  if (!/^\d{6,8}$/.test(normalizedCode)) return false;
  const counter = Math.floor(Date.now() / 1000 / stepSeconds);
  for (let i = -window; i <= window; i += 1) {
    if (hotp(secret, counter + i, digits) === normalizedCode) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(input: { secret: string; accountName: string; issuer: string }) {
  const issuer = String(input.issuer || "Newton Immigration");
  const account = String(input.accountName || "user");
  const label = encodeURIComponent(`${issuer}:${account}`);
  const query = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
