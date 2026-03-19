import { PgwpIntakeData } from "@/lib/models";

export type Imm5710Question = {
  key: keyof PgwpIntakeData;
  label: string;
};

export const IMM5710_CORE_QUESTIONS: Imm5710Question[] = [
  { key: "fullName", label: "Full name" },
  { key: "phone", label: "Phone number" },
  { key: "maritalStatus", label: "Marital status" },
  { key: "address", label: "Current and mailing address" },
  { key: "travelHistorySixMonths", label: "Travel history over 6 months (Yes/No + details)" },
  { key: "nativeLanguage", label: "Native language" },
  { key: "englishTestTaken", label: "English test taken (Yes/No)" },
  { key: "originalEntryDate", label: "Original entry date to Canada" },
  { key: "originalEntryPlacePurpose", label: "Place of entry to Canada and purpose" },
  { key: "education", label: "Any education after 12th (Yes/No + details)" },
  { key: "educationDetails", label: "Education details (if more than diploma)" },
  { key: "employmentHistory", label: "Employment details" },
  { key: "refusedAnyCountry", label: "Any refusal/flagpoling (Yes/No)" },
  { key: "criminalHistory", label: "Any criminal history (Yes/No + details)" },
  { key: "medicalHistory", label: "Any medical history (Yes/No + details)" },
  { key: "additionalNotes", label: "Any other details" },
  { key: "refusalDetails", label: "Refusal details (if Yes)" }
];

export function getMissingImm5710Questions(intake?: PgwpIntakeData): Imm5710Question[] {
  const current = intake ?? {};
  return IMM5710_CORE_QUESTIONS.filter((q) => {
    const value = String(current[q.key] ?? "").trim();

    if (q.key === "fullName") {
      const first = String(current.firstName ?? "").trim();
      const last = String(current.lastName ?? "").trim();
      if (value || (first && last)) return false;
    }
    if (q.key === "englishTestTaken") {
      const legacy = String(current.ieltsDetails ?? "").trim();
      if (value || legacy) return false;
    }

    if (q.key === "otherNameDetails") {
      const usedOther = String(current.usedOtherName ?? "").toLowerCase();
      if (!usedOther.startsWith("y")) return false;
    }
    if (q.key === "spouseName" || q.key === "spouseDateOfMarriage") {
      const marital = String(current.maritalStatus ?? "").toLowerCase();
      const needsPartner = marital.includes("married") || marital.includes("common");
      if (!needsPartner) return false;
    }
    if (q.key === "previousRelationshipDetails") {
      const prev = String(current.previousMarriageCommonLaw ?? "").toLowerCase();
      if (!prev.startsWith("y")) return false;
    }
    if (q.key === "recentEntryDetails") {
      const recent = String(current.recentEntryAny ?? "").toLowerCase();
      if (!recent.startsWith("y")) return false;
    }
    if (q.key === "refusalDetails") {
      const refused = String(current.refusedAnyCountry ?? "").toLowerCase();
      if (!refused.startsWith("y")) return false;
    }
    if (q.key === "educationDetails") {
      const education = String(current.education ?? "").toLowerCase();
      const requiresDetails =
        education.includes("bachelor") ||
        education.includes("master") ||
        education.includes("other");
      if (!requiresDetails) return false;
    }

    return !value;
  });
}

export type PgwpChatQuestion = Imm5710Question & {
  prompt: string;
  formatHint?: string;
};

export const PGWP_CHAT_QUESTION_FLOW: PgwpChatQuestion[] = IMM5710_CORE_QUESTIONS.map((q) => ({
  ...q,
  prompt: `Please provide: ${q.label}.`,
  formatHint:
    q.key.toLowerCase().includes("date")
      ? "Use YYYY-MM-DD format."
      : q.key === "email"
        ? "Use a valid email address."
        : q.key === "phone"
          ? "Use digits only if possible."
          : undefined
}));

export function getNextPgwpChatQuestion(intake?: PgwpIntakeData): PgwpChatQuestion | null {
  const missing = getMissingImm5710Questions(intake);
  if (missing.length === 0) return null;
  const next = missing[0];
  const flowItem = PGWP_CHAT_QUESTION_FLOW.find((q) => q.key === next.key);
  return flowItem ?? { ...next, prompt: `Please provide: ${next.label}.` };
}

export function validateIntakeAnswer(
  key: keyof PgwpIntakeData,
  value: string
): { ok: true; normalized: string } | { ok: false; error: string } {
  const text = String(value || "").trim();
  if (!text) return { ok: false, error: "Answer cannot be empty." };

  if (key.toLowerCase().includes("date")) {
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Please provide a valid date (YYYY-MM-DD)." };
    }
    return { ok: true, normalized: text };
  }

  if (key === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return { ok: false, error: "Please provide a valid email address." };
    }
    return { ok: true, normalized: text };
  }

  if (key === "phone") {
    const digits = text.replace(/[^\d+]/g, "");
    if (digits.length < 7) {
      return { ok: false, error: "Please provide a valid phone number." };
    }
    return { ok: true, normalized: digits };
  }

  return { ok: true, normalized: text };
}
