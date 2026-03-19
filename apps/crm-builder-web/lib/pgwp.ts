import { CaseItem, DocumentItem } from "@/lib/models";

export type PgwpDraft = {
  applicationType: "PGWP";
  requiredDocuments: Array<{
    key: string;
    label: string;
    required: boolean;
    matchedDocumentName?: string;
    received: boolean;
  }>;
  missingDocuments: string[];
  missingOptionalDocuments: string[];
  riskFlags: string[];
  reviewChecklist: string[];
  finalSubmissionOrder: string[];
  recommendedFileNames: string[];
  representativeLetterDraft: string;
};

const PGWP_REQUIRED_DOCS = [
  { key: "passport", label: "Passport (all pages with stamps)", required: true },
  { key: "permit", label: "Valid Study Permit", required: true },
  { key: "completion_letter", label: "Completion Letter", required: true },
  { key: "official_transcript", label: "Official Transcripts", required: true },
  { key: "digital_photo", label: "Digital Photo", required: true },
  { key: "client_information", label: "Client Information PDF (compiled package)", required: false },
  { key: "language_test", label: "Language Proficiency Test (IELTS/CELPIP/PTE)", required: false },
  { key: "past_studies", label: "Past Studies / Old College Documents", required: false },
  { key: "upfront_medical", label: "Proof of Upfront Medical", required: false }
] as const;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchDoc(docName: string, key: string) {
  const n = normalize(docName);
  if (key === "passport") return n.includes("passport");
  if (key === "permit") return n.includes("permit") || n.includes("study permit");
  if (key === "completion_letter") return n.includes("completion") || n.includes("completion letter");
  if (key === "official_transcript") return n.includes("transcript");
  if (key === "client_information")
    return (n.includes("client") && n.includes("info")) || n.includes("client information");
  if (key === "language_test") return n.includes("ielts") || n.includes("celpip") || n.includes("pte") || n.includes("language");
  if (key === "digital_photo") return n.includes("photo") || n.includes("digital photo");
  if (key === "past_studies") return n.includes("study") || n.includes("past") || n.includes("college");
  if (key === "upfront_medical") return n.includes("medical");
  return false;
}

function parseDate(value?: string): Date | null {
  const text = String(value || "").trim();
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(older: Date, newer: Date): number {
  const diffMs = newer.getTime() - older.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function generatePgwpDraft(caseItem: CaseItem, documents: DocumentItem[]): PgwpDraft {
  const requiredDocuments = PGWP_REQUIRED_DOCS.map((req) => {
    const matched = documents.find((d) => matchDoc(d.name, req.key));
    return {
      key: req.key,
      label: req.label,
      required: req.required,
      matchedDocumentName: matched?.name,
      received: Boolean(matched)
    };
  });

  const missingDocuments = requiredDocuments
    .filter((d) => d.required && !d.received)
    .map((d) => d.label);
  const missingOptionalDocuments = requiredDocuments
    .filter((d) => !d.required && !d.received)
    .map((d) => d.label);

  const riskFlags: string[] = [];
  if (missingDocuments.length > 0) {
    riskFlags.push(`Missing required PGWP documents: ${missingDocuments.join(", ")}`);
  }
  if (missingOptionalDocuments.length > 0) {
    riskFlags.push(`Optional/conditional documents not provided yet: ${missingOptionalDocuments.join(", ")}`);
  }
  if (!caseItem.retainerSigned) {
    riskFlags.push("Retainer not signed.");
  }
  if (caseItem.paymentStatus !== "paid") {
    riskFlags.push("Payment not confirmed.");
  }
  if (!caseItem.questionnaireLink) {
    riskFlags.push("Questionnaire link not assigned.");
  }

  if (String(caseItem.pgwpIntake?.fullTimeStudentThroughout || "").toLowerCase().includes("no")) {
    riskFlags.push("Not full-time throughout studies declared. LOE + reviewer attention required.");
  }
  if (String(caseItem.pgwpIntake?.gapsOrPartTimeDetails || "").trim()) {
    riskFlags.push("Gaps/part-time details present. Ensure LOE is included.");
  }
  if (String(caseItem.pgwpIntake?.previousCollegesInCanada || "").trim()) {
    riskFlags.push("Previous colleges declared. Ensure all prior transcripts are attached.");
  }
  if (String(caseItem.pgwpIntake?.academicProbationOrTransfer || "").trim()) {
    riskFlags.push("Probation/transfer details present. Add explanation and supporting records.");
  }
  if (String(caseItem.pgwpIntake?.unauthorizedWorkDuringStudies || "").toLowerCase().includes("yes")) {
    riskFlags.push("Unauthorized work declared. Escalate to senior review.");
  }

  const completionDate = parseDate(caseItem.pgwpIntake?.completionLetterDate);
  if (completionDate) {
    const days = daysBetween(completionDate, new Date());
    if (days > 180) {
      riskFlags.push("Completion letter appears older than 180 days. Eligibility risk.");
    }
  }

  const studyPermitExpiry = parseDate(caseItem.pgwpIntake?.studyPermitExpiryDate);
  if (studyPermitExpiry && studyPermitExpiry.getTime() < Date.now()) {
    riskFlags.push("Study permit appears expired. Check restoration + PGWP strategy.");
  }

  const passportExpiry = parseDate(caseItem.pgwpIntake?.passportExpiryDate);
  if (passportExpiry) {
    const daysLeft = daysBetween(new Date(), passportExpiry);
    if (daysLeft < 365) {
      riskFlags.push("Passport validity is under 12 months. Consider renewal before filing.");
    }
  }

  const reviewChecklist = [
    "Client information package prepared (include permits, old studies, IELTS/other language test if available).",
    "Completion letter present.",
    "Transcripts match program and completion details.",
    "Study permit valid at completion date.",
    "No missing previous college/academic history.",
    "LOE included if gap/part-time/probation/transfer exists.",
    "IMM5710 validated in Adobe.",
    "Dates consistent across all documents.",
    "Passport validity checked."
  ];

  const finalSubmissionOrder = [
    "Representative Submission Letter",
    "Client Information PDF (permits + old college docs + IELTS/other English test, if available)",
    "IMM5710",
    "IMM5476 (if representative used)",
    "Completion Letter",
    "Official Transcript",
    "Passport",
    "Digital Photo",
    "Proof of Upfront Medical (if applicable)"
  ];

  const safeClient = caseItem.client.replace(/\s+/g, "");
  const recommendedFileNames = [
    `${safeClient}_PGWP_Passport.pdf`,
    `${safeClient}_PGWP_StudyPermit.pdf`,
    `${safeClient}_PGWP_CompletionLetter.pdf`,
    `${safeClient}_PGWP_Transcripts.pdf`,
    `${safeClient}_PGWP_LOE.pdf`,
    `${safeClient}_PGWP_IMM5710.pdf`,
    `${safeClient}_PGWP_IMM5476.pdf`
  ];

  const representativeLetterDraft = [
    "Representative Letter - Draft",
    "Application Type: Post-Graduation Work Permit (PGWP)",
    `Case ID: ${caseItem.id}`,
    `Client Name: ${caseItem.client}`,
    `Passport Number: ${caseItem.pgwpIntake?.passportNumber || "TBD"}`,
    `Program + DLI: ${caseItem.pgwpIntake?.programNameDuration || "TBD"} | ${caseItem.pgwpIntake?.dliNameLocation || "TBD"}`,
    `Study Permit Validity: ${caseItem.pgwpIntake?.studyPermitExpiryDate || "TBD"}`,
    "",
    "To IRCC Officer,",
    "",
    "This submission is made in support of a Post-Graduation Work Permit application.",
    "The applicant has completed eligible studies in Canada and is requesting issuance of an open work permit.",
    "The applicant has maintained full-time status in each academic session, except where permitted under IRCC guidelines.",
    "Any deviations from full-time status have been explained in the attached Letter of Explanation and comply with IRCC provisions.",
    "All required supporting documents are included with this submission.",
    "",
    "Please review the attached completion letter, official transcripts, permit records, identity documents, and explanations.",
    "",
    "Sincerely,",
    "Authorized Representative"
  ].join("\n");

  return {
    applicationType: "PGWP",
    requiredDocuments,
    missingDocuments,
    missingOptionalDocuments,
    riskFlags,
    reviewChecklist,
    finalSubmissionOrder,
    recommendedFileNames,
    representativeLetterDraft
  };
}
