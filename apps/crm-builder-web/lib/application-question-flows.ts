import { resolveApplicationChecklistKey } from "@/lib/application-checklists";

export type IntakeRecord = Record<string, string>;

type ChecklistKey = ReturnType<typeof resolveApplicationChecklistKey>;

type QuestionFlow = {
  prompts: string[];
  requiredFields: string[];
};

const DEFAULT_REQUIRED_FIELDS = [
  "fullName",
  "phone",
  "maritalStatus",
  "address",
  "travelHistorySixMonths",
  "nativeLanguage",
  "englishTestTaken",
  "originalEntryDate",
  "originalEntryPlacePurpose",
  "employmentHistory",
  "education",
  "refusedAnyCountry",
  "criminalHistory",
  "medicalHistory"
];

const QUESTION_FLOWS: Record<ChecklistKey, QuestionFlow> = {
  pgwp: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Any recent entry to Canada? (date + reason)",
      "Any gaps, breaks, or part-time semesters during studies? (explain)",
      "Previous colleges attended in Canada (if any)",
      "Any academic probation or transfer history? (explain)"
    ]
  },
  trv_inside: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Name of the person you are visiting in Canada",
      "Relationship with that person",
      "Address in Canada where that person lives",
      "Funds available for your stay in Canada",
      "Who will pay your expenses in Canada?"
    ]
  },
  visitor_visa: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "List all countries lived in during the past 5 years (if different from citizenship country)",
      "Any post-secondary studies? Provide school, field, and dates",
      "Military/police/security service history (if any)",
      "List employment and activities in the last 10 years",
      "Travel history in the last 5 years (country, dates, purpose)",
      "Parents' details (name, DOB, occupation, address)",
      "Children details (if any)"
    ]
  },
  visitor_record: {
    requiredFields: [
      "fullName",
      "phone",
      "maritalStatus",
      "address",
      "nativeLanguage",
      "refusedAnyCountry",
      "criminalHistory",
      "medicalHistory"
    ],
    prompts: [
      "Current status in Canada and expiry details",
      "Reason for extension and requested duration",
      "Proof of funds summary"
    ]
  },
  work_permit: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Date and place you first entered Canada",
      "Purpose of original visit to Canada",
      "Any recent entry to Canada? (date + reason)",
      "Employment details from most recent (from/to/title/employer/city)",
      "Education after 12th (from/to/field/institute/city)"
    ]
  },
  study_permit: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Program/institution details and start date",
      "Funding plan for tuition and living expenses",
      "Any study gaps/explanations"
    ]
  },
  study_permit_extension: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Current institution and enrollment details",
      "Reason for extension/college change",
      "Current permit details and expiry date"
    ]
  },
  super_visa: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Sponsor full name, status in Canada, and address",
      "Sponsor relationship with applicant",
      "Insurance coverage details",
      "Family info (spouse/children/parents)"
    ]
  },
  express_entry: {
    requiredFields: [
      "fullName",
      "phone",
      "maritalStatus",
      "address",
      "nativeLanguage",
      "englishTestTaken",
      "employmentHistory",
      "education",
      "refusedAnyCountry",
      "criminalHistory",
      "medicalHistory"
    ],
    prompts: [
      "Primary NOC/job title and years of skilled experience",
      "Language test details (IELTS/CELPIP/TEF + scores + date)",
      "Education credentials and ECA details (WES/other)",
      "Proof of funds amount available (if applicable)",
      "Any provincial nomination or Canadian job offer details",
      "Spouse language/education/work details (if applicable)"
    ]
  },
  family_sponsorship: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Sponsor details (status in Canada, occupation, address)",
      "Relationship history details",
      "Children/dependants details (if any)"
    ]
  },
  citizenship_prcard: {
    requiredFields: [
      "fullName",
      "phone",
      "address",
      "nativeLanguage"
    ],
    prompts: [
      "Address history and travel history summary",
      "Current status and prior travel documents/passports"
    ]
  },
  us_b1b2: {
    requiredFields: [
      "fullName",
      "phone",
      "address",
      "maritalStatus",
      "employmentHistory",
      "education",
      "criminalHistory",
      "medicalHistory"
    ],
    prompts: [
      "US trip purpose, intended dates, and address in US",
      "US point of contact details",
      "Family details (parents/spouse)",
      "Social media handles used in last 5 years"
    ]
  },
  uk_visitor: {
    requiredFields: [
      "fullName",
      "phone",
      "address",
      "maritalStatus",
      "employmentHistory",
      "criminalHistory",
      "medicalHistory"
    ],
    prompts: [
      "UK visit purpose and expected arrival date",
      "Address history for the past 2 years",
      "Travel history and past refusals",
      "Family in UK (if any) with details"
    ]
  },
  refugee: {
    requiredFields: [
      "fullName",
      "phone",
      "address",
      "maritalStatus",
      "nativeLanguage",
      "employmentHistory",
      "education",
      "refusedAnyCountry",
      "criminalHistory",
      "medicalHistory"
    ],
    prompts: [
      "Detailed explanation of why you left your country",
      "Key incidents (dates, threats, people/groups involved)",
      "Address history for last 10 years",
      "Travel history for last 5 years",
      "Parents/siblings/children details"
    ]
  },
  canadian_passport_doc: {
    requiredFields: ["fullName", "phone", "address"],
    prompts: [
      "Any previous names used",
      "Eye color and height (cm)",
      "Address history for past 2 years",
      "Occupation history for past 2 years",
      "Guarantor details",
      "References and emergency contact details"
    ]
  },
  generic: {
    requiredFields: [
      "fullName",
      "phone",
      "address",
      "maritalStatus",
      "refusedAnyCountry",
      "criminalHistory",
      "medicalHistory"
    ],
    prompts: [
      "Provide key details relevant to your application",
      "Any refusals, criminal, or medical history details",
      "Any additional notes for your case team"
    ]
  }
};

function asText(value: unknown): string {
  return String(value || "").trim();
}

function parseSpecificAnswers(raw: unknown, prompts: string[]): Record<string, string> {
  const output: Record<string, string> = {};
  for (const prompt of prompts) output[prompt] = "";
  const source = asText(raw);
  if (!source) return output;
  try {
    const parsed = JSON.parse(source) as Record<string, unknown>;
    for (const prompt of prompts) output[prompt] = asText(parsed[prompt]);
    return output;
  } catch {
    return output;
  }
}

function isYes(value: string): boolean {
  const normalized = asText(value).toLowerCase();
  return normalized.startsWith("y");
}

function hasValue(intake: IntakeRecord, key: string): boolean {
  return asText(intake[key]).length > 0;
}

export function getQuestionFlowForFormType(formType: string): QuestionFlow {
  const key = resolveApplicationChecklistKey(formType || "generic");
  return QUESTION_FLOWS[key] || QUESTION_FLOWS.generic;
}

export function getQuestionPromptsForFormType(formType: string): string[] {
  return getQuestionFlowForFormType(formType).prompts;
}

export function isQuestionnaireComplete(formType: string, intake: IntakeRecord): boolean {
  const flow = getQuestionFlowForFormType(formType);
  const requiredBaseOk = flow.requiredFields.every((field) => hasValue(intake, field));
  if (!requiredBaseOk) return false;

  if (isYes(asText(intake.usedOtherName)) && !hasValue(intake, "otherNameDetails")) return false;

  const marital = asText(intake.maritalStatus).toLowerCase();
  const requiresSpouse = marital.includes("married") || marital.includes("common");
  if (requiresSpouse && (!hasValue(intake, "spouseName") || !hasValue(intake, "spouseDateOfMarriage"))) {
    return false;
  }

  if (isYes(asText(intake.previousMarriageCommonLaw)) && !hasValue(intake, "previousRelationshipDetails")) {
    return false;
  }

  if (isYes(asText(intake.refusedAnyCountry)) && !hasValue(intake, "refusalDetails")) return false;

  if (isYes(asText(intake.travelHistorySixMonths)) && !hasValue(intake, "travelHistoryDetails")) return false;

  const education = asText(intake.education).toLowerCase();
  if (["bachelor", "master", "other"].includes(education) && !hasValue(intake, "educationDetails")) {
    return false;
  }

  const specific = parseSpecificAnswers(intake.applicationSpecificAnswers, flow.prompts);
  const promptsOk = flow.prompts.every((prompt) => asText(specific[prompt]).length > 0);
  return promptsOk;
}

