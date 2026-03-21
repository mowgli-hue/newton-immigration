import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt$";

export function isPasswordHash(value: string): boolean {
  return String(value || "").startsWith(HASH_PREFIX);
}

export async function hashPassword(plainText: string): Promise<string> {
  const password = String(plainText || "");
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${HASH_PREFIX}${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  const stored = String(storedHash || "");
  if (!isPasswordHash(stored)) {
    return plainText === stored;
  }
  const [, salt = "", expectedHex = ""] = stored.split("$");
  if (!salt || !expectedHex) return false;
  const derived = (await scrypt(String(plainText || ""), salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

export function validatePasswordStrength(password: string): { ok: boolean; reason?: string } {
  const value = String(password || "");
  if (value.length < 10) {
    return { ok: false, reason: "Password must be at least 10 characters." };
  }
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
    return {
      ok: false,
      reason: "Password must include uppercase, lowercase, and a number."
    };
  }
  return { ok: true };
}
