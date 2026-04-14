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
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: provide partner's full name and date of marriage (YYYY-MM-DD). Reply NA if not applicable.",
      "Any previous marriage or common-law partnership? (Yes/No — if Yes: partner's name, date of birth, start and end date of relationship YYYY-MM-DD)",
      "Current mailing address including postal code (Apt/Unit, Street Number, Street Name, City, Province, Postal Code)",
      "Residential address if different from mailing address. Reply SAME if same.",
      "Telephone number",
      "Date and place you first entered Canada (YYYY-MM-DD, city/airport e.g. 2019-09-01, Toronto Pearson)",
      "Purpose of your original visit to Canada (Study / Work / Visit)",
      "Any recent entry to Canada? (Yes/No — if Yes: provide date YYYY-MM-DD and reason)",
      "Have you ever been refused a visa or permit, denied entry, or ordered to leave Canada or any other country? (Yes/No — if Yes: provide details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)",
      "Employment details — list all jobs most recent first. For each: From (YYYY-MM), To (YYYY-MM), Job Title, Employer Name, City. Reply NONE if no employment.",
      "Education after 12th grade (if any). For each: From (YYYY-MM), To (YYYY-MM), Field of Study, Name of Institute, City. Reply NONE if none.",
      "What is your native language?",
      "Have you taken an English language proficiency test? (Yes/No — if Yes: test name, score, and date)",
      "Do you plan to work in the medical field in Canada in the future? (Yes/No — if Yes: please provide your medical exam/test details)"
    ]
  },
  trv_inside: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: provide partner's full name, DOB, citizenship. Reply NA if not applicable.",
      "Current mailing address in Canada including postal code (Apt/Unit, Street Number, Street Name, City, Province, Postal Code)",
      "Telephone number",
      "What is your current immigration status in Canada and expiry date? (e.g. Visitor — expires YYYY-MM-DD)",
      "What country do you currently live in and what is your immigration status there? (e.g. India — Citizen)",
      "What is the purpose of your visit to Canada? (Tourism / Visiting family / Business / Other — provide details)",
      "What date does your visit start? (YYYY-MM-DD) and when do you plan to leave Canada? (YYYY-MM-DD)",
      "Address in Canada where you will stay (full address including postal code)",
      "Will you be visiting anyone in Canada? (Yes/No — if Yes: full name, relationship, and their address)",
      "How much money do you have available for your stay in Canada? (amount in CAD)",
      "Who will pay your expenses in Canada? (Myself / Parents / Other — if Other: name and relationship)",
      "Date and place you first entered Canada (YYYY-MM-DD, city/port of entry)",
      "Have you ever been refused a visa or permit for Canada or any other country? (Yes/No — if Yes: details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)",
      "What is your native language? Can you communicate in English or French? (Yes/No)"
    ]
  },
  visitor_visa: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Full name as on passport (Family name, Given name)",
      "Date of birth (YYYY-MM-DD)",
      "Gender (Male / Female)",
      "Country of birth and city of birth",
      "Country of citizenship",
      "Passport number, issuing country, issue date (YYYY-MM-DD) and expiry date (YYYY-MM-DD)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: spouse full name, DOB, citizenship. Reply NA if not applicable.",
      "Current country of residence and your immigration status there (Citizen / PR / Worker / Student / Visitor)",
      "Any other countries you have lived in last 5 years? For each: country, status, from date, to date. Reply NONE if none.",
      "Current home address (Street, City, Postal Code, Country) and phone number with country code",
      "Purpose of visit to Canada (Tourism / Visit family / Business / Conference — provide full details)",
      "Planned travel dates — arriving Canada (YYYY-MM-DD) and leaving Canada (YYYY-MM-DD)",
      "Contact in Canada — full name, relationship to you, their address, phone, and email",
      "How much money do you have available for this trip in CAD? Will funds be shared with anyone? (Yes/No)",
      "Education history — for each: school name, country, field of study, from/to dates (YYYY-MM)",
      "Employment history (no gaps since age 18) — for each: from (YYYY-MM), to (YYYY-MM or present), job title, employer, city, country",
      "Travel history last 5 years — for each trip: country visited, from (YYYY-MM), to (YYYY-MM), purpose",
      "Have you ever overstayed a visa, been refused entry, or been deported from any country? (Yes/No — if Yes: details)",
      "Have you ever been refused a Canadian visa or permit? (Yes/No — if Yes: details)",
      "Do you have any criminal history or medical conditions? (Yes/No for each — if Yes: provide details)",
      "Native language and can you communicate in English or French? (English / French / Both / Neither)"
    ]
  },
  visitor_record: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: provide partner's full name and date of marriage (YYYY-MM-DD). Reply NA if not applicable.",
      "Current mailing address in Canada including postal code (Apt/Unit, Street Number, Street Name, City, Province, Postal Code)",
      "Telephone number",
      "What is your current immigration status in Canada? (Visitor / Student / Worker) and what is your status expiry date? (YYYY-MM-DD)",
      "What are you applying for? (Extend my stay as a visitor / Restore my status as a visitor)",
      "What is the purpose of your visit to Canada? (Tourism / Visiting family / Business / Other — provide details)",
      "What date does your visit start? (YYYY-MM-DD) and when do you plan to leave Canada? (YYYY-MM-DD)",
      "How much money do you have available for your stay in Canada? (amount in CAD)",
      "Who will pay your expenses in Canada? (Myself / Parents / Other — if Other: provide name and relationship)",
      "Will you be visiting anyone in Canada? (Yes/No — if Yes: their full name, relationship, and address in Canada)",
      "Date and place you first entered Canada (YYYY-MM-DD, city/port of entry)",
      "Have you ever been refused a visa or permit for Canada or any other country? (Yes/No — if Yes: country, year, reason)",
      "Do you have any medical history that may affect your stay? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)",
      "What is your native language? Can you communicate in English or French? (Yes/No)"
    ]
  },
  work_permit: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: provide partner's full name and date of marriage (YYYY-MM-DD). Reply NA if not applicable.",
      "Any previous marriage or common-law partnership? (Yes/No — if Yes: partner's name, date of birth, start and end date of relationship YYYY-MM-DD)",
      "Current mailing address including postal code (Apt/Unit, Street Number, Street Name, City, Province, Postal Code)",
      "Residential address if different from mailing address. Reply SAME if same.",
      "Telephone number",
      "Date and place you first entered Canada (YYYY-MM-DD, city/airport)",
      "Purpose of your original visit to Canada (Study / Work / Visit)",
      "Any recent entry to Canada? (Yes/No — if Yes: provide date YYYY-MM-DD and reason)",
      "Have you ever been refused a visa or permit, denied entry, or ordered to leave Canada or any other country? (Yes/No — if Yes: provide details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)",
      "Employment details — list all jobs most recent first. For each: From (YYYY-MM), To (YYYY-MM), Job Title, Employer Name, City. Reply NONE if no employment.",
      "Education after 12th grade (if any). For each: From (YYYY-MM), To (YYYY-MM), Field of Study, Name of Institute, City. Reply NONE if none.",
      "What is your native language?",
      "Have you taken an English language proficiency test? (Yes/No — if Yes: test name, score, and date)",
      "Do you plan to work in the medical field in Canada in the future? (Yes/No — if Yes: please provide your medical exam/test details)"
    ]
  },
  study_permit: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: provide partner's full name and date of marriage (YYYY-MM-DD). Reply NA if not applicable.",
      "Any previous marriage or common-law partnership? (Yes/No — if Yes: partner's name, DOB, start and end date YYYY-MM-DD)",
      "Current mailing address including postal code (Apt/Unit, Street Number, Street Name, City, Province, Postal Code)",
      "Residential address if different from mailing address. Reply SAME if same.",
      "Telephone number",
      "Date and place you first entered Canada (YYYY-MM-DD, city/airport). If applying from outside Canada reply OUTSIDE.",
      "Name and address of the institution you plan to attend in Canada",
      "Program of study and expected start date (YYYY-MM-DD) and end date (YYYY-MM-DD)",
      "Highest education completed (school name, field, country, from/to dates YYYY-MM)",
      "How are you funding your studies? (Savings / Sponsor / Scholarship / Loan — provide amount available in CAD)",
      "Who is your financial sponsor? (Name, relationship, occupation, country of residence). Reply SELF if self-funded.",
      "Have you ever studied in Canada before? (Yes/No — if Yes: institution, program, permit expiry date)",
      "Have you ever been refused a visa or permit for Canada or any other country? (Yes/No — if Yes: country, year, reason)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)",
      "What is your native language? Have you taken an English proficiency test? (Yes/No — if Yes: test name, score, date)"
    ]
  },
  study_permit_extension: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "Current mailing address including postal code (Apt/Unit, Street Number, Street Name, City, Province, Postal Code)",
      "Telephone number",
      "Current study permit number and expiry date (YYYY-MM-DD)",
      "Current institution name and city",
      "Current program of study and expected completion date (YYYY-MM-DD)",
      "Are you changing colleges/institutions? (Yes/No — if Yes: new institution name, program, start date YYYY-MM-DD and reason for change)",
      "Are you changing your program of study? (Yes/No — if Yes: old program and new program details)",
      "Reason for extension — are you still enrolled or did you need more time to complete? (provide details)",
      "Have you maintained full-time enrollment throughout your studies? (Yes/No — if No: explain)",
      "Have you ever been refused a visa or permit? (Yes/No — if Yes: details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)"
    ]
  },
  super_visa: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married: provide spouse full name, DOB, and citizenship. Reply NA if not applicable.",
      "Current address in your home country (full address)",
      "Telephone number",
      "Sponsor full name and relationship to you (son/daughter/etc.)",
      "Sponsor address in Canada (full address including postal code)",
      "Sponsor immigration status in Canada (Canadian Citizen / Permanent Resident) and document number",
      "Sponsor occupation, employer name, and annual income in CAD",
      "Date you plan to enter Canada (YYYY-MM-DD) and expected length of stay",
      "List your children (name, DOB, relationship, country of residence for each). Reply NONE if no children.",
      "Do you have medical insurance arranged? (Yes/No — if Yes: insurance company name and coverage amount in CAD)",
      "Have you ever been refused a visa or permit for Canada or any other country? (Yes/No — if Yes: details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)"
    ]
  },
  express_entry: {
    requiredFields: [
      "fullName", "phone", "maritalStatus", "address", "nativeLanguage",
      "englishTestTaken", "employmentHistory", "education",
      "refusedAnyCountry", "criminalHistory", "medicalHistory"
    ],
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "If Married or Common-Law: spouse full name, DOB, citizenship, education level, occupation. Reply NA if not applicable.",
      "Current address (full address with postal code or country)",
      "Telephone number",
      "Primary job title and NOC code (if known). How many years of skilled work experience in this field?",
      "List all skilled work experience — for each: From (YYYY-MM), To (YYYY-MM), Job Title, NOC code, Employer, City, Country, Hours/week",
      "Highest education completed — institution name, field of study, country, from/to dates. Do you have an ECA report? (Yes/No — if Yes: which organization e.g. WES)",
      "Language test results — test name (IELTS/CELPIP/TEF), scores for Reading/Writing/Listening/Speaking, test date (YYYY-MM-DD)",
      "Spouse language test results (if applicable) — test name, scores, date. Reply NA if not applicable.",
      "Do you have a provincial nomination? (Yes/No — if Yes: province and program name)",
      "Do you have a Canadian job offer? (Yes/No — if Yes: employer name, NOC code, job title, LMIA number if applicable)",
      "Proof of settlement funds available (amount in CAD)",
      "Have you ever lived in Canada? (Yes/No — if Yes: permit type, dates, province)",
      "Have you ever been refused a visa or permit for Canada or any other country? (Yes/No — if Yes: details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)"
    ]
  },
  family_sponsorship: {
    requiredFields: DEFAULT_REQUIRED_FIELDS,
    prompts: [
      "Have you used any other name? (Yes/No — if Yes, provide full other name)",
      "What is your current marital status? (Single / Married / Common-Law / Divorced / Widowed / Separated)",
      "Sponsor full name, date of birth, and relationship to you",
      "Sponsor address in Canada (full address including postal code)",
      "Sponsor immigration status in Canada (Canadian Citizen / Permanent Resident) and document number",
      "Sponsor occupation and employer name",
      "Date and place of your marriage or relationship start (YYYY-MM-DD, city, country)",
      "Any previous marriage or common-law partnership? (Yes/No — if Yes: partner name, DOB, dates of relationship YYYY-MM-DD)",
      "Current address (full address with postal code or country if outside Canada)",
      "Telephone number",
      "Children/dependants details — for each: full name, DOB, relationship, citizenship, currently living with you? (Yes/No)",
      "Have you ever applied for or been refused immigration to Canada or any other country? (Yes/No — if Yes: details)",
      "Do you have any medical history? (Yes/No — if Yes: provide details)",
      "Do you have any criminal history? (Yes/No — if Yes: provide details)",
      "What is your native language? Have you taken an English proficiency test? (Yes/No — if Yes: test name, score, date)"
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

