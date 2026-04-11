/**
 * Maps CRM pgwpIntake fields → fill_imm5710.py EMPTY_CLIENT format
 * Passport fields (name, DOB, passport number/dates) come from passport scan
 * All other fields come from WhatsApp intake answers
 */

export function mapIntakeToImm5710(intake: Record<string, any>, formType: string): Record<string, any> {
  const i = intake || {};

  // Parse application specific answers (from WhatsApp Q&A)
  let specific: Record<string, string> = {};
  try {
    specific = JSON.parse(i.applicationSpecificAnswers || "{}");
  } catch { /* ignore */ }

  // Helper to get specific answer by question number or keyword
  const getByNum = (n: number): string => {
    const key = Object.keys(specific)[n - 1];
    return key ? String(specific[key] || "") : "";
  };
  const getQ = (keyword: string): string => {
    const key = Object.keys(specific).find(k => k.toLowerCase().includes(keyword.toLowerCase()));
    return key ? String(specific[key] || "") : "";
  };

  // Q4: Previous marriage
  const prevMarriageRaw = getByNum(4) || getQ("previous marriage") || getQ("previous common") || "";
  const hasPrevMarriage = prevMarriageRaw.toLowerCase().startsWith("y");
  const prevMarriageParts = prevMarriageRaw.split(/[,;]+/).map((p: string) => p.trim());

  // Parse address fields from "123 Main St, Toronto, ON, M5V 2T6" format
  const parseAddress = (raw: string) => {
    const parts = raw.split(",").map(p => p.trim());
    // Try to detect street number from first part
    const streetMatch = (parts[0] || "").match(/^(\d+)\s+(.+)/);
    return {
      apt_unit: "",
      street_num: streetMatch ? streetMatch[1] : "",
      street_name: streetMatch ? streetMatch[2] : (parts[0] || ""),
      city: parts[1] || "",
      province: parts[2] || "",
      postal_code: parts[3] || "",
      country: "Canada",
    };
  };

  // Parse phone from raw string e.g. "+1 604 123 4567" or "6041234567"
  const parsePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const num = digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;
    return {
      area_code: num.slice(0, 3),
      first_three: num.slice(3, 6),
      last_five: num.slice(6),
    };
  };

  // Parse DOB from YYYY-MM-DD
  const parseDOB = (raw: string) => {
    const parts = (raw || "").split("-");
    return { year: parts[0] || "", month: parts[1] || "", day: parts[2] || "" };
  };

  // Parse passport dates
  const passportIssue = parseDOB(i.passportIssueDate || "");
  const passportExpiry = parseDOB(i.passportExpiryDate || "");
  const dob = parseDOB(i.dateOfBirth || "");
    // Q5/Q6: Addresses
  const mailingRaw = getByNum(5) || i.address || i.residentialAddress || "";
  const residentialRaw = getByNum(6) || "";
  const address = parseAddress(mailingRaw);
  const residentialSame = !residentialRaw || residentialRaw.toLowerCase().includes("same");
  const residentialAddress = residentialSame ? address : parseAddress(residentialRaw);
  const phoneRaw = getByNum(7) || i.phone || "";
  const phone = parsePhone(phoneRaw);

  // UCI from WhatsApp Q1
  const uciRaw = getQ("UCI") || getQ("Client ID") || i.uci || "";
  const uci = uciRaw.toLowerCase() === "none" ? "" : uciRaw;

  // Q1: Other name
  const aliasRaw = getByNum(1) || getQ("other name") || getQ("alias") || i.usedOtherName || "";
  const hasAlias = aliasRaw.toLowerCase().startsWith("y");
  const aliasDetails = hasAlias ? (i.otherNameDetails || getQ("other name") || "") : "";
  const aliasParts = aliasDetails.split(" ");

  // Sex from WhatsApp Q3
  const sexRaw = getQ("sex") || getQ("gender") || i.sex || "";
  const sexMap: Record<string, string> = { f: "Female", m: "Male", female: "Female", male: "Male" };
  const sex = sexMap[sexRaw.toLowerCase().trim()] || sexRaw;

  // Birth place from WhatsApp Q4
  const birthPlaceRaw = getQ("born in") || getQ("birth") || i.placeOfBirthCity || "";
  const birthParts = birthPlaceRaw.split(",").map((p: string) => p.trim());

  // Current status from WhatsApp Q5
  const statusRaw = getQ("current status") || i.currentCountryStatus || i.currentStatus || "";
  const statusParts = statusRaw.split(/[,\s]+/);
  const statusOptions = ["Student", "Worker", "Visitor", "Other"];
  const currentStatus = statusOptions.find(s => statusRaw.toLowerCase().includes(s.toLowerCase())) || "Student";
  const expiryDateMatch = statusRaw.match(/(\d{4}-\d{2}-\d{2})/);
  const currentStatusExpiry = expiryDateMatch ? expiryDateMatch[1] : i.studyPermitExpiryDate || "";

  // Status start date from WhatsApp Q6
  const statusStartRaw = getQ("status STARTED") || getQ("status start") || i.currentCountryFromDate || "";
  const statusStartMatch = statusStartRaw.match(/(\d{4}-\d{2}-\d{2})/);
  const currentStatusStart = statusStartMatch ? statusStartMatch[1] : statusStartRaw;

  // Permit number from WhatsApp Q7
  const permitNum = getQ("permit number") || i.permitDetails || "";

  // Email from WhatsApp Q9
  const email = getQ("email") || i.email || "";

  // Q2: Marital status
  const maritalRaw = getByNum(2) || getQ("marital") || i.maritalStatus || "Single";
  const maritalOptions = ["Single", "Married", "Common-Law", "Divorced", "Widowed", "Separated"];
  const maritalStatus = maritalOptions.find(m => maritalRaw.toLowerCase().includes(m.toLowerCase())) || maritalRaw;

  // Q3: Spouse details
  const spouseRaw = getByNum(3) || getQ("spouse") || getQ("partner") || i.spouseName || "";
  const spouseParts = spouseRaw.split(/\s+/);
  const marriageDateMatch = spouseRaw.match(/(\d{4}-\d{2}-\d{2})/);
  const dateOfMarriage = marriageDateMatch ? marriageDateMatch[1] : i.spouseDateOfMarriage || "";

  // Q16/Q17: Language
  const nativeLang = getByNum(16) || getQ("native language") || i.nativeLanguage || "";
  const langTestRaw = getByNum(17) || getQ("proficiency test") || getQ("IELTS") || i.englishTestTaken || i.ieltsDetails || "";
  const commLang = getQ("official language") || i.canCommunicateEnglishFrench || "English";
  const langTestTaken = langTestRaw.toLowerCase().startsWith("y") || langTestRaw.toLowerCase().includes("ielts") || langTestRaw.toLowerCase().includes("celpip");

  // Q8/Q9/Q10: Entry
  const entryRaw = getByNum(8) || getQ("original entry") || getQ("first entered") || "";
  const entryDateMatch = entryRaw.match(/(\d{4}-\d{2}-\d{2})/);
  const originalEntryDate = entryDateMatch ? entryDateMatch[1] : i.originalEntryDate || "";
  const originalEntryPlace = entryRaw.replace(/\d{4}-\d{2}-\d{2}/, "").replace(/,/, "").trim() || i.originalEntryPlace || "";

  const entryPurposeRaw = getByNum(9) || getQ("purpose of original") || i.originalEntryPlacePurpose || "Study";
  const purposeOptions = ["Study", "Work", "Visit", "Other"];
  const entryPurpose = purposeOptions.find(p => entryPurposeRaw.toLowerCase().includes(p.toLowerCase())) || "Study";

  const recentEntryRaw = getByNum(10) || getQ("re-entry") || getQ("recent entry") || i.recentEntryAny || "";
  const recentDateMatch = recentEntryRaw.match(/(\d{4}-\d{2}-\d{2})/);
  const recentEntryDate = recentDateMatch ? recentDateMatch[1] : "";
  const recentEntryPlace = recentDateMatch ? recentEntryRaw.replace(recentDateMatch[1], "").trim() : "";

  // Q15: Education
  const eduRaw = getByNum(15) || getQ("education") || i.educationDetails || i.education || "";
  const hasEdu = eduRaw.toLowerCase() !== "no" && eduRaw.toLowerCase() !== "none" && eduRaw.length > 3;
  const eduYearMatch = eduRaw.match(/(\d{4})/g);

  // Q14: Employment
  const empRaw = getByNum(14) || getQ("employment") || i.employmentHistory || "";
  const employment: any[] = [];
  if (empRaw.toLowerCase() !== "none" && empRaw.length > 5) {
    // Parse lines like "Company Name, Job Title, City, 2020-01 to 2023-12"
    const lines = empRaw.split(/\n|;/).filter((l: string) => l.trim().length > 3).slice(0, 3);
    lines.forEach((line: string) => {
      const dateMatches = line.match(/(\d{4})-(\d{2})/g);
      employment.push({
        from_year: dateMatches?.[0]?.split("-")[0] || "",
        from_month: dateMatches?.[0]?.split("-")[1] || "",
        to_year: dateMatches?.[1]?.split("-")[0] || "Present",
        to_month: dateMatches?.[1]?.split("-")[1] || "",
        occupation: line.split(",")[1]?.trim() || line.split(",")[0]?.trim() || "",
        employer: line.split(",")[0]?.trim() || "",
        city: line.split(",")[2]?.trim() || "",
        country: "Canada",
        prov_state: "",
      });
    });
  }

  // Q11/Q12/Q13: Background
  const refusalRaw = getByNum(11) || getQ("refused") || getQ("denied entry") || i.refusalDetails || "No";
  const hasRefusal = refusalRaw.toLowerCase().startsWith("y") || (refusalRaw.length > 5 && !refusalRaw.toLowerCase().startsWith("n"));
  const refusalDetails = hasRefusal ? refusalRaw : "";

  const criminalRaw = getByNum(13) || getQ("criminal") || i.criminalHistory || "No";
  const hasCriminal = criminalRaw.toLowerCase().startsWith("y") || (criminalRaw.length > 5 && !criminalRaw.toLowerCase().startsWith("n"));

  const medicalRaw = getByNum(12) || getQ("medical history") || i.medicalHistory || "No";
  const medicalFieldRaw = getByNum(18) || getQ("medical field") || "";
  const medicalFieldNote = medicalFieldRaw.toLowerCase().startsWith("y") ? " | Medical field: " + medicalFieldRaw : "";
  const hasMedical = medicalRaw.toLowerCase().startsWith("y") || (medicalRaw.length > 5 && !medicalRaw.toLowerCase().startsWith("n"));

  // Application type
  const ft = (formType || "").toLowerCase();
  const isRestore = ft.includes("restore");
  const isExtend = ft.includes("pgwp") || ft.includes("owp") || ft.includes("sowp") || ft.includes("bowp") || ft.includes("vowp") || ft.includes("extend");

  return {
    // Section 1
    applying_restore_status: isRestore,
    applying_extend_stay: isExtend && !isRestore,
    applying_change_employer: ft.includes("change employer") || ft.includes("lmia"),
    applying_trp: ft.includes("trp"),

    // Section 2 — from passport scan
    uci_client_id: uci,
    family_name: i.lastName || (i.fullName || "").split(" ").slice(-1)[0] || "",
    given_name: i.firstName || (i.fullName || "").split(" ")[0] || "",
    has_alias: hasAlias,
    alias_family_name: aliasParts[1] || "",
    alias_given_name: aliasParts[0] || "",
    sex,
    dob_year: dob.year,
    dob_month: dob.month,
    dob_day: dob.day,
    place_birth_city: birthParts[0] || "",
    place_birth_country: birthParts[1] || i.countryOfBirth || "",
    citizenship_country: i.citizenship || i.countryOfBirth || "",

    // Section 3
    current_status: currentStatus,
    current_status_from_date: currentStatusStart,
    current_status_to_date: currentStatusExpiry,
    prev_country_1: "",
    prev_status_1: "",
    prev_from_date_1: "",
    prev_to_date_1: "",

    // Section 4
    marital_status: maritalStatus,
    spouse_family_name: spouseParts[1] || spouseParts[0] || "",
    spouse_given_name: spouseParts[0] || "",
    date_of_marriage: dateOfMarriage,
    spouse_status_in_canada: "",
    previously_married: hasPrevMarriage,
    prev_spouse_family_name: hasPrevMarriage ? (prevMarriageParts[1] || "").split(" ").slice(-1)[0] : "",
    prev_spouse_given_name: hasPrevMarriage ? (prevMarriageParts[1] || "").split(" ")[0] : "",
    prev_relationship_type: hasPrevMarriage ? "Married" : "",
    prev_marriage_from: hasPrevMarriage ? (prevMarriageParts[3] || "") : "",
    prev_marriage_to: hasPrevMarriage ? (prevMarriageParts[4] || "") : "",

    // Section 5
    native_language: nativeLang,
    communicate_language: commLang.includes("rench") ? "French" : commLang.includes("oth") ? "Both" : "English",
    language_test_taken: langTestTaken,
    frequent_language: nativeLang || "English",

    // Section 6 — from passport scan
    passport_number: i.passportNumber || "",
    passport_country: i.citizenship || i.countryOfBirth || "",
    passport_issue_year: passportIssue.year,
    passport_issue_month: passportIssue.month,
    passport_issue_day: passportIssue.day,
    passport_expiry_year: passportExpiry.year,
    passport_expiry_month: passportExpiry.month,
    passport_expiry_day: passportExpiry.day,
    has_national_id: false,
    has_us_card: false,

    // Section 7
    mailing_apt_unit: address.apt_unit,
    mailing_street_num: address.street_num,
    mailing_street_name: address.street_name,
    mailing_city: address.city,
    mailing_province: address.province,
    mailing_postal_code: address.postal_code,
    mailing_country: "Canada",
    residential_same_as_mailing: residentialSame,
    residential_apt_unit: residentialSame ? "" : residentialAddress.apt_unit,
    residential_street_num: residentialSame ? "" : residentialAddress.street_num,
    residential_street_name: residentialSame ? "" : residentialAddress.street_name,
    residential_city: residentialSame ? "" : residentialAddress.city,
    residential_province: residentialSame ? "" : residentialAddress.province,
    phone_type: "Canada/US",
    phone_number_type: "Mobile",
    phone_area_code: phone.area_code,
    phone_first_three: phone.first_three,
    phone_last_five: phone.last_five,
    email,

    // Section 8
    original_entry_date: originalEntryDate,
    original_entry_place: originalEntryPlace,
    original_entry_purpose: entryPurpose,
    recent_entry_date: recentEntryDate,
    recent_entry_place: recentEntryPlace,
    previous_doc_number: permitNum,

    // Work permit details (for LMIA/employer-specific)
    work_permit_type: ft.includes("lmia") ? "Work" : "",

    // Section 9
    has_education: hasEdu,
    edu_school_name: hasEdu ? eduRaw.split(",")[0]?.trim() : "",
    edu_field_of_study: hasEdu ? (eduRaw.split(",")[1]?.trim() || "") : "",
    edu_city: hasEdu ? (eduRaw.split(",")[2]?.trim() || "") : "",
    edu_country: "Canada",
    edu_from_year: eduYearMatch?.[0] || "",
    edu_from_month: "09",
    edu_to_year: eduYearMatch?.[1] || "",
    edu_to_month: "06",

    // Section 10
    employment,

    // Section 11
    has_medical_condition: hasMedical || medicalFieldRaw.toLowerCase().startsWith("y"),
    medical_details: hasMedical ? (medicalRaw + medicalFieldNote) : (medicalFieldRaw.toLowerCase().startsWith("y") ? medicalFieldNote.replace(" | ","") : ""),
    prev_application_refused: hasRefusal,
    prev_refused_to_canada: hasRefusal && refusalRaw.toLowerCase().includes("canada"),
    prev_refused_details: refusalDetails,
    has_criminal_record: hasCriminal,
    criminal_details: hasCriminal ? criminalRaw : "",
    has_military_service: false,
    held_government_position: false,
    witnessed_ill_treatment: false,
  };
}
