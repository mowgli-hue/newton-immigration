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
  | "trv_inside"
  | "visitor_visa"
  | "visitor_record"
  | "work_permit"
  | "study_permit"
  | "study_permit_extension"
  | "super_visa"
  | "express_entry"
  | "family_sponsorship"
  | "citizenship_prcard"
  | "us_b1b2"
  | "uk_visitor"
  | "refugee"
  | "canadian_passport_doc"
  | "generic" {
  const ft = normalize(formType);
  if (ft.includes("pgwp") || ft.includes("post graduation") || ft.includes("imm5710")) return "pgwp";
  if (ft.includes("trv inside")) return "trv_inside";
  if (ft.includes("visitor visa") || ft.includes("trv outside") || ft === "trv") return "visitor_visa";
  if (ft.includes("visitor record")) return "visitor_record";
  if (
    ft.includes("work permit") ||
    ft.includes("lmia") ||
    ft.includes("sowp") ||
    ft.includes("open work permit")
  )
    return "work_permit";
  if (ft.includes("study permit")) return "study_permit";
  if (ft.includes("study permit extension") || ft.includes("college change") || ft.includes("spe")) return "study_permit_extension";
  if (ft.includes("super visa") || ft.includes("supervisa")) return "super_visa";
  if (ft.includes("express entry") || ft.includes("pnp") || ft.includes("pr application")) return "express_entry";
  if (ft.includes("spousal sponsorship") || ft.includes("parents") || ft.includes("grandparents sponsorship") || ft.includes("family sponsorship")) return "family_sponsorship";
  if (ft.includes("citizenship") || ft.includes("pr card renewal") || ft.includes("pr card replacement")) return "citizenship_prcard";
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
  trv_inside: [
    { key: "current_permit", label: "Current Permit", required: true, keywords: ["current permit", "permit"] },
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "digital_photo", label: "Digital Photo", required: true, keywords: ["digital photo", "photo"] }
  ],
  visitor_visa: [
    { key: "current_permit", label: "Current Permit", required: true, keywords: ["current permit", "permit"] },
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "digital_photo", label: "Digital Photo", required: true, keywords: ["digital photo", "photo"] }
  ],
  visitor_record: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "current_status", label: "Current Permit/Status Documents", required: true, keywords: ["permit", "visa", "status"] },
    { key: "funds", label: "Proof of Funds", required: true, keywords: ["fund", "bank", "statement"] },
    { key: "reason_letter", label: "Extension/Stay Reason Letter", required: false, keywords: ["letter", "explanation", "visitor record"] }
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
  study_permit_extension: [
    { key: "passport", label: "Passport (front/back clear copies)", required: true, keywords: ["passport"] },
    { key: "permits", label: "All current permits", required: true, keywords: ["permit"] },
    { key: "photo", label: "Recent digital photograph", required: true, keywords: ["photo", "digital"] },
    { key: "enrollment", label: "Enrollment letter", required: true, keywords: ["enrollment"] },
    { key: "transcripts", label: "Unofficial transcripts", required: true, keywords: ["transcript"] },
    { key: "tuition", label: "Tuition fee receipts", required: true, keywords: ["tuition", "fee receipt"] },
    { key: "loa", label: "LOA + PAL (if applicable)", required: true, keywords: ["loa", "pal"] },
    { key: "previous_college", label: "Previous college docs (if transfer)", required: false, keywords: ["previous", "old college", "transfer"] }
  ],
  super_visa: [
    { key: "passport", label: "Applicant Passport(s)", required: true, keywords: ["passport"] },
    { key: "digital_photo", label: "Digital Photo", required: true, keywords: ["photo"] },
    { key: "medical", label: "Proof of Upfront Medical", required: true, keywords: ["medical"] },
    { key: "insurance", label: "Medical Insurance", required: true, keywords: ["insurance"] },
    { key: "applicant_funds", label: "Applicant Proof of Funds", required: true, keywords: ["fund", "bank", "certificate", "statement"] },
    { key: "marriage", label: "Marriage Certificate (if applicable)", required: false, keywords: ["marriage certificate"] },
    { key: "sponsor_status", label: "Sponsor Status Proof (PR/Citizenship)", required: true, keywords: ["pr card", "canadian passport", "certificate"] },
    { key: "sponsor_income", label: "Sponsor Income Docs (NOA/T4/Job/Paystubs)", required: true, keywords: ["noa", "t4", "job letter", "paystub"] },
    { key: "sponsor_birth", label: "Sponsor Birth Certificate (if available)", required: false, keywords: ["birth certificate"] }
  ],
  express_entry: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "language", label: "Language Test (IELTS/CELPIP/TEF)", required: true, keywords: ["ielts", "celpip", "tef"] },
    { key: "eca", label: "ECA Report (WES or equivalent)", required: true, keywords: ["eca", "wes"] },
    { key: "work_reference", label: "Work Experience Reference Letters", required: true, keywords: ["reference letter", "employment letter", "experience letter"] },
    { key: "education_docs", label: "Education Transcripts/Degree", required: true, keywords: ["degree", "diploma", "transcript"] },
    { key: "proof_funds", label: "Proof of Funds", required: false, keywords: ["proof of funds", "bank statement", "bank certificate"] },
    { key: "pcc", label: "Police Clearance Certificate (if available)", required: false, keywords: ["police clearance", "pcc"] }
  ],
  family_sponsorship: [
    { key: "passport", label: "Passport(s)", required: true, keywords: ["passport"] },
    { key: "status_docs", label: "Sponsor Status Proof (PR card/citizenship)", required: true, keywords: ["pr card", "citizenship", "canadian passport"] },
    { key: "relationship", label: "Relationship Proof (marriage/birth/etc.)", required: true, keywords: ["marriage certificate", "birth certificate", "relationship proof"] },
    { key: "financials", label: "Sponsor Financial Docs (NOA/T4/paystubs)", required: true, keywords: ["noa", "t4", "paystub", "job letter"] },
    { key: "photos_chat", label: "Photos/Communication Evidence", required: false, keywords: ["photo", "chat", "call log"] }
  ],
  citizenship_prcard: [
    { key: "id_docs", label: "Current ID + Existing PR card/Passport", required: true, keywords: ["id", "pr card", "passport"] },
    { key: "travel_history", label: "Travel/Address history details", required: true, keywords: ["travel history", "address history"] },
    { key: "photos", label: "Required photos", required: true, keywords: ["photo"] },
    { key: "supporting", label: "Supporting documents (if requested)", required: false, keywords: ["supporting", "explanation"] }
  ],
  us_b1b2: [
    { key: "passport", label: "Passport", required: true, keywords: ["passport"] },
    { key: "photo", label: "Digital Photo (DS-160 specs)", required: true, keywords: ["photo"] },
    { key: "travel_history", label: "Travel History / Visa Refusal Details", required: false, keywords: ["travel", "refusal"] },
    { key: "employment_education", label: "Employment/Education history details", required: false, keywords: ["employment", "education", "school"] },
    { key: "social_media", label: "Social media handles (last 5 years)", required: false, keywords: ["social media", "handle"] }
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
    { key: "legal_evidence", label: "Legal/Threat Supporting Evidence", required: false, keywords: ["court", "police", "threat", "evidence"] },
    { key: "narrative", label: "Detailed claim narrative/explanation", required: true, keywords: ["explanation", "claim", "incident"] }
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
