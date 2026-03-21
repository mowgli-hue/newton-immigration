export function normalizeEmail(input: unknown): string {
  return String(input ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizePhone(input: unknown): string {
  return String(input ?? "").trim();
}

export function isReasonablePhone(phone: string): boolean {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function boundedText(input: unknown, max = 500): string {
  const value = String(input ?? "").trim();
  if (value.length <= max) return value;
  return value.slice(0, max);
}

