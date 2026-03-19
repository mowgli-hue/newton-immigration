import { DocumentItem } from "@/lib/models";

export type ApplicationChecklistItem = {
  key: string;
  label: string;
  required: boolean;
  keywords: string[];
};

function normalize(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveApplicationChecklistKey(formType: string):
  | "pgwp"
  | "trv"
  | "visitor_record"
  | "work_permit"
  | "study_permit"
  | "super_visa"
  | "us_b1b2"
  | "uk_visitor"
  | "refugee"
  | "canadian_passport_doc"
  | "generic" {
  const ft = normalize(formType);
  if (ft.includes("pgwp") || ft.includes("post graduation") || ft.includes("imm5710")) return "pgwp";
  if (ft.includes("trv") || ft.includes("visitor visa")) return "trv";
  if (ft.includes("visitor record")) return "visitor_record";
  if (
    ft.includes("work permit") ||
    ft.includes("lmia") ||
    ft.includes("sowp") ||
    ft.includes("open work permit")
  )
    return "work_permit";
  if (ft.includes("study permit")) return "study_permit";
  if (ft.includes("super visa") || ft.includes("supervisa")) return "super_visa";
  if (ft.includes("ds 160") || ft.includes("b1") || ft.includes("b2") || ft.includes("usa")) return "us_b1b2";
  if (ft.includes("uk visa") || ft.includes("uk visitor")) return "uk_visitor";
  if (ft.includes("refugee")) return "refugee";
  if (ft.includes("canadian passport") || ft.includes("travel document")) return "canadian_passport_doc";
  return "generic";
}

const CHECKLISTS: Record<string, ApplicationChecklistItem[]> = {
  pgwp: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "study_permit", label: "Valid Study Permit", required: true, keywords: ["study permit", "permit"] },
    { key: "completion_letter", label: "Completion Letter", required: true, keywords: ["completion letter", "completion"] },
    { key: "transcripts", label: "Official Transcripts", required: true, keywords: ["transcript"] },
    { key: "digital_photo", label: "Digital Photo", required: true, keywords: ["photo", "digital photo"] },
    { key: "language_test", label: "Language Test (IELTS/CELPIP/PTE)", required: false, keywords: ["ielts", "celpip", "pte", "language"] },
    { key: "old_studies", label: "Old/Past College Documents (if transfer)", required: false, keywords: ["old college", "past stud", "previous college"] }
  ],
  trv: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "proof_funds", label: "Proof of Funds", required: true, keywords: ["fund", "bank", "statement", "itr", "ca report"] },
    { key: "employment_docs", label: "Employment Docs (Job letter + payslips, if working)", required: false, keywords: ["job letter", "payslip", "employment"] },
    { key: "study_docs", label: "Study Docs (if studying)", required: false, keywords: ["enrollment", "loa", "transcript", "school"] },
    { key: "sponsor_docs", label: "Sponsor Documents", required: false, keywords: ["sponsor", "t4", "permit", "noa"] }
  ],
  visitor_record: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "current_status", label: "Current Permit/Status Documents", required: true, keywords: ["permit", "visa", "status"] },
    { key: "funds", label: "Proof of Funds", required: true, keywords: ["fund", "bank", "statement"] }
  ],
  work_permit: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "current_permits", label: "All Current Permits", required: true, keywords: ["permit"] },
    { key: "job_offer", label: "Job Offer/Employment Support Docs", required: true, keywords: ["job", "offer", "employment", "lmia"] },
    { key: "education_docs", label: "Education Documents", required: false, keywords: ["education", "degree", "diploma", "transcript"] },
    { key: "language_test", label: "English Test (if available)", required: false, keywords: ["ielts", "celpip", "pte", "language"] }
  ],
  study_permit: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "loa", label: "Letter of Acceptance (LOA)", required: true, keywords: ["loa", "letter of acceptance"] },
    { key: "tuition", label: "Tuition Fee Payment Proof", required: true, keywords: ["tuition", "fee receipt"] },
    { key: "education_docs", label: "Education Credentials", required: true, keywords: ["marksheet", "transcript", "degree", "diploma"] },
    { key: "funds", label: "Bank Statements / Financial Proof", required: true, keywords: ["bank", "statement", "fund"] },
    { key: "language", label: "English Proficiency", required: false, keywords: ["ielts", "toefl", "pte"] },
    { key: "medical", label: "Medical Exam", required: false, keywords: ["medical"] }
  ],
  super_visa: [
    { key: "passport", label: "Applicant Passport", required: true, keywords: ["passport"] },
    { key: "digital_photo", label: "Digital Photo", required: true, keywords: ["photo"] },
    { key: "medical", label: "Proof of Upfront Medical", required: true, keywords: ["medical"] },
    { key: "insurance", label: "Medical Insurance", required: true, keywords: ["insurance"] },
    { key: "applicant_funds", label: "Applicant Proof of Funds", required: true, keywords: ["fund", "bank", "certificate", "statement"] },
    { key: "sponsor_status", label: "Sponsor Status Proof (PR/Citizenship)", required: true, keywords: ["pr card", "canadian passport", "certificate"] },
    { key: "sponsor_income", label: "Sponsor Income Docs (NOA/T4/Job/Paystubs)", required: true, keywords: ["noa", "t4", "job letter", "paystub"] }
  ],
  us_b1b2: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "photo", label: "Digital Photo (DS-160 specs)", required: true, keywords: ["photo"] },
    { key: "travel_history", label: "Travel History / Visa Refusal Details", required: false, keywords: ["travel", "refusal"] }
  ],
  uk_visitor: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "photo", label: "Digital Photo", required: true, keywords: ["photo"] },
    { key: "bank", label: "Bank Statements", required: true, keywords: ["bank", "statement"] },
    { key: "job_or_school", label: "Job Letter + Payslips / Enrollment Letter", required: true, keywords: ["job letter", "pay", "enrollment", "school"] },
    { key: "sponsor_docs", label: "Sponsor Docs (if applicable)", required: false, keywords: ["sponsor"] }
  ],
  refugee: [
    { key: "passport", label: "Passport (all pages)", required: true, keywords: ["passport"] },
    { key: "id_docs", label: "National/Civil ID + Birth Certificate", required: true, keywords: ["id", "birth certificate"] },
    { key: "entry_proof", label: "Entry Proof (stamp/eGate/tickets)", required: true, keywords: ["entry", "stamp", "ticket", "boarding"] },
    { key: "canada_status", label: "Current/Past Canadian Permit Docs", required: false, keywords: ["permit", "visa"] },
    { key: "legal_evidence", label: "Legal/Threat Supporting Evidence", required: false, keywords: ["court", "police", "threat", "evidence"] }
  ],
  canadian_passport_doc: [
    { key: "citizenship_certificate", label: "Citizenship Certificate", required: true, keywords: ["citizenship certificate"] },
    { key: "photo_id", label: "Photo ID", required: true, keywords: ["photo id", "driver", "health card"] },
    { key: "passport_photos", label: "Passport Photos (2)", required: true, keywords: ["passport photo", "photo"] },
    { key: "old_passport", label: "Old Passport/Travel Document (if any)", required: false, keywords: ["travel document", "old passport"] },
    { key: "guarantor", label: "Guarantor Documents", required: true, keywords: ["guarantor"] },
    { key: "references", label: "References + Emergency Contact", required: true, keywords: ["reference", "emergency"] }
  ],
  generic: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "application_docs", label: "Application Supporting Documents", required: true, keywords: ["document", "support", "proof"] }
  ]
};

export function getChecklistForFormType(formType: string): ApplicationChecklistItem[] {
  const key = resolveApplicationChecklistKey(formType);
  return CHECKLISTS[key] || CHECKLISTS.generic;
}

export function getMissingChecklistDocs(formType: string, documents: DocumentItem[]): string[] {
  const docs = documents.map((d) => normalize(d.name));
  const checklist = getChecklistForFormType(formType).filter((i) => i.required);
  return checklist
    .filter((item) => !item.keywords.some((k) => docs.some((name) => name.includes(normalize(k)))))
    .map((item) => item.label);
}
