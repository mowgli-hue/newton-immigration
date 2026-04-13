// lib/ircc-script-generator.ts
// Generates a ready-to-paste IRCC portal autofill script from CRM case data

import { CaseItem, PgwpIntakeData } from "@/lib/models";

// ─── Country name → IRCC dropdown value mapping ───────────────────────────────
// IRCC uses lowercase country names in their dropdowns
function normalizeCountry(country: string): string {
  const map: Record<string, string> = {
    "india": "india",
    "pakistan": "pakistan",
    "canada": "canada",
    "united states": "united states",
    "usa": "united states",
    "us": "united states",
    "china": "china",
    "philippines": "philippines",
    "saudi arabia": "saudi",
    "uae": "united arab emirates",
    "united arab emirates": "united arab emirates",
    "nigeria": "nigeria",
    "mexico": "mexico",
    "bangladesh": "bangladesh",
    "nepal": "nepal",
    "sri lanka": "sri lanka",
    "uk": "united kingdom",
    "united kingdom": "united kingdom",
    "england": "united kingdom",
    "france": "france",
    "germany": "germany",
    "australia": "australia",
    "new zealand": "new zealand",
    "iran": "iran",
    "iraq": "iraq",
    "yemen": "yemen",
    "egypt": "egypt",
    "ghana": "ghana",
    "kenya": "kenya",
    "ethiopia": "ethiopia",
    "colombia": "colombia",
    "brazil": "brazil",
    "vietnam": "vietnam",
    "south korea": "south korea",
    "korea": "south korea",
    "japan": "japan",
    "turkey": "turkey",
    "ukraine": "ukraine",
    "russia": "russia",
    "poland": "poland",
    "romania": "romania",
    "senegal": "senegal",
    "morocco": "morocco",
    "tunisia": "tunisia",
    "algeria": "algeria",
    "jordan": "jordan",
    "lebanon": "lebanon",
    "syria": "syria",
    "afghanistan": "afghanistan",
    "malaysia": "malaysia",
    "indonesia": "indonesia",
    "thailand": "thailand",
    "singapore": "singapore",
  };
  const key = country.toLowerCase().trim();
  return map[key] || key;
}

// ─── Marital status → IRCC code ───────────────────────────────────────────────
function maritalCode(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("married")) return "01";
  if (s.includes("single") || s.includes("never")) return "02";
  if (s.includes("common")) return "03";
  if (s.includes("divorced")) return "04";
  if (s.includes("separated")) return "05";
  if (s.includes("widow")) return "06";
  return "02"; // default single
}

// ─── Native language → IRCC code ─────────────────────────────────────────────
function languageCode(lang: string): string {
  const l = (lang || "").toLowerCase();
  if (l.includes("punjabi")) return "180";
  if (l.includes("hindi")) return "090";
  if (l.includes("urdu")) return "240";
  if (l.includes("arabic")) return "250";
  if (l.includes("chinese") || l.includes("mandarin") || l.includes("cantonese")) return "042";
  if (l.includes("tagalog") || l.includes("filipino")) return "211";
  if (l.includes("spanish")) return "200";
  if (l.includes("french")) return "072";
  if (l.includes("portuguese")) return "175";
  if (l.includes("bengali")) return "028";
  if (l.includes("gujarati")) return "083";
  if (l.includes("tamil")) return "210";
  if (l.includes("telugu")) return "214";
  if (l.includes("nepali")) return "153";
  if (l.includes("sinhala")) return "196";
  if (l.includes("vietnamese")) return "246";
  if (l.includes("korean")) return "112";
  if (l.includes("japanese")) return "101";
  if (l.includes("farsi") || l.includes("persian")) return "066";
  if (l.includes("amharic")) return "010";
  if (l.includes("somali")) return "198";
  if (l.includes("english")) return "059";
  return "059"; // default english
}

// ─── Parse date string ────────────────────────────────────────────────────────
function parseDate(dateStr: string): { year: string; month: string; day: string } | null {
  if (!dateStr) return null;
  // Handle YYYY-MM-DD
  const match = dateStr.match(/(\d{4})[^\d](\d{1,2})[^\d](\d{1,2})/);
  if (match) {
    return {
      year: match[1],
      month: match[2].padStart(2, "0"),
      day: match[3].padStart(2, "0"),
    };
  }
  // Handle YYYY-MM
  const shortMatch = dateStr.match(/(\d{4})[^\d](\d{1,2})/);
  if (shortMatch) {
    return { year: shortMatch[1], month: shortMatch[2].padStart(2, "0"), day: "01" };
  }
  return null;
}

// ─── Parse employment history text into structured entries ────────────────────
function parseEmploymentHistory(text: string): Array<{
  from: { year: string; month: string };
  to: { year: string; month: string } | null;
  occupation: string;
  jobTitle: string | null;
  employer: string;
  duties: string;
  country: string;
  street: string;
  city: string;
}> {
  if (!text) return [];

  // Try to parse structured entries like "Title, Employer, City (YYYY-MM to YYYY-MM)"
  const entries: ReturnType<typeof parseEmploymentHistory> = [];
  const lines = text.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Look for date ranges
    const dateRange = line.match(/(\d{4}[-/]\d{1,2})\s*[-–to]+\s*(\d{4}[-/]\d{1,2}|present|current|now)/i);
    const fromDate = dateRange ? parseDate(dateRange[1]) : null;
    const toDateStr = dateRange ? dateRange[2] : null;
    const isCurrent = toDateStr ? /present|current|now/i.test(toDateStr) : false;
    const toDate = !isCurrent && toDateStr ? parseDate(toDateStr) : null;

    // Extract employer and title
    const cleanLine = line.replace(/\(.*?\)/g, "").trim();
    const parts = cleanLine.split(/[,–-]/).map((p) => p.trim()).filter(Boolean);

    entries.push({
      from: fromDate ? { year: fromDate.year, month: fromDate.month } : { year: "2020", month: "01" },
      to: isCurrent ? null : (toDate ? { year: toDate.year, month: toDate.month } : { year: "2023", month: "01" }),
      occupation: "006", // Default: Business/Finance
      jobTitle: null,
      employer: parts[1] || parts[0] || "Unknown Employer",
      duties: parts[0] || "Employment",
      country: "india", // Default — team should update
      street: parts[2] || "",
      city: parts[2] || "",
    });
  }

  return entries.length > 0 ? entries : [{
    from: { year: "2020", month: "01" },
    to: null,
    occupation: "006",
    jobTitle: null,
    employer: text.substring(0, 50),
    duties: text.substring(0, 50),
    country: "india",
    street: "",
    city: "",
  }];
}

// ─── Main generator ───────────────────────────────────────────────────────────
export function generateVisitorVisaScript(
  caseItem: CaseItem,
  intake: PgwpIntakeData,
  visitDetails: {
    visitDateFrom: { year: string; month: string; day: string };
    visitDateTo: { year: string; month: string; day: string };
    visitPurpose: string;
    inviterLastName?: string;
    inviterFirstName?: string;
    inviterRelation?: string;
    inviterOrgName?: string;
    inviterProvince?: string;
    inviterStreetNum?: string;
    inviterStreet?: string;
    inviterCity?: string;
    inviterPostal?: string;
    inviterPhone?: string;
    inviterEmail?: string;
    funds?: string;
  }
): string {
  const dob = parseDate(intake.dateOfBirth || "") || { year: "1990", month: "01", day: "01" };
  const passportIssued = parseDate(intake.passportIssueDate || "") || { year: "2020", month: "01", day: "01" };
  const passportExpiry = parseDate(intake.passportExpiryDate || "") || { year: "2030", month: "01", day: "01" };
  const citizenFrom = parseDate(intake.dateOfBirth || "") || dob;

  const fullName = intake.fullName || caseItem.client || "";
  const nameParts = fullName.trim().split(/\s+/);
  const lastName = intake.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0]);
  const firstName = intake.firstName || (nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0]);

  const phone = (intake.phone || "").replace(/\D/g, "");
  const phoneCountryCode = phone.startsWith("1") ? "1" : phone.length > 10 ? phone.slice(0, phone.length - 10) : "1";
  const phoneNumber = phone.length >= 10 ? phone.slice(-10) : phone;

  const birthCountry = normalizeCountry(intake.countryOfBirth || "india");
  const citizenship = normalizeCountry(intake.citizenship || intake.countryOfBirth || "india");
  const addressCountry = normalizeCountry(intake.currentCountry || "canada");

  const employmentEntries = parseEmploymentHistory(intake.employmentHistory || "");

  // Parse travel history
  const travelEntries: Array<{ fromY: string; fromM: string; toY: string; toM: string; country: string; location: string; purpose: string }> = [];
  if (intake.travelHistoryDetails) {
    const lines = intake.travelHistoryDetails.split(/[\n;]+/).filter(Boolean);
    for (const line of lines) {
      const dateMatch = line.match(/(\d{4}[-/]\d{1,2})/g);
      if (dateMatch && dateMatch.length >= 2) {
        const from = parseDate(dateMatch[0]);
        const to = parseDate(dateMatch[1]);
        if (from && to) {
          travelEntries.push({
            fromY: from.year, fromM: from.month,
            toY: to.year, toM: to.month,
            country: line.split(/[\d:,-]/)[0].trim() || "Unknown",
            location: line.replace(/[\d\-\/]+/g, "").trim().substring(0, 40),
            purpose: "Visit",
          });
        }
      }
    }
  }

  const data = {
    visitDateFrom: visitDetails.visitDateFrom,
    visitDateTo: visitDetails.visitDateTo,
    visitDetails: visitDetails.visitPurpose,
    eventCode: "",
    funds: visitDetails.funds || "10000",
    fundsShared: false,

    rep: {
      lastName: "Sandhu",
      firstName: "Navdeep Singh",
      type: "08",
      typeDesc: "Immigration Representative",
      phone: "7787236662",
      email: "newtonimmigration@gmail.com",
      province: "11",
      streetNum: "8327",
      street: "120 Street",
      city: "Delta",
      postal: "V4C 6R1",
    },

    lastName,
    firstName,
    dob,
    gender: "male", // Team should update if female

    passportNumber: intake.passportNumber || "",
    passportCountry: citizenship.substring(0, 3).toUpperCase(),
    passportNat: citizenship,
    passportIssued,
    passportExpiry,

    birthCountry,
    birthCity: intake.placeOfBirthCity || "",
    citizenshipCountry: citizenship,
    citizenshipFrom: citizenFrom,

    addressCountry,
    addressStreet: intake.address || "",
    addressCity: intake.city || "",
    addressPostal: intake.postalCode || "",
    phone: phoneNumber,
    phoneCountryCode,

    residences: [{
      country: addressCountry,
      status: "03",
      from: { year: "2020", month: "01", day: "01" },
      to: { year: "2027", month: "01", day: "01" },
      currentlyLive: false,
    }],

    education: [{
      school: intake.educationDetails || "See education history",
      from: { year: "2015", month: "09" },
      to: { year: "2019", month: "06" },
      level: "04",
      field: "03",
      country: birthCountry,
      street: intake.placeOfBirthCity || "",
      city: intake.placeOfBirthCity || "",
    }],

    employment: employmentEntries,

    travel: travelEntries,

    inviter: {
      lastName: visitDetails.inviterLastName || "Contact",
      firstName: visitDetails.inviterFirstName || "Canadian",
      relation: visitDetails.inviterRelation || "09",
      orgName: visitDetails.inviterOrgName || "",
      province: visitDetails.inviterProvince || "02",
      streetNum: visitDetails.inviterStreetNum || "123",
      street: visitDetails.inviterStreet || "Main Street",
      city: visitDetails.inviterCity || "Toronto",
      postal: visitDetails.inviterPostal || "M5V 1A1",
      phoneType: "05",
      phone: visitDetails.inviterPhone || "4161234567",
      email: visitDetails.inviterEmail || "newtonimmigration@gmail.com",
    },

    nativeLanguage: languageCode(intake.nativeLanguage || "english"),
    knowEnglishFrench: "01",
    preferredLang: "01",

    maritalStatus: maritalCode(intake.maritalStatus || "single"),
    hasChildren: false,

    parents: [
      { lastName: "Father", firstName: "Unknown", rel: "father", dob: { year: "1960", month: "01", day: "01" }, birthCountry, occupation: "Unknown", sameAddress: false, addrCountry: birthCountry, addrStreet: "", addrCity: intake.placeOfBirthCity || "", comingToCanada: false },
      { lastName: "Mother", firstName: "Unknown", rel: "mother", dob: { year: "1962", month: "01", day: "01" }, birthCountry, occupation: "Unknown", sameAddress: false, addrCountry: birthCountry, addrStreet: "", addrCity: intake.placeOfBirthCity || "", comingToCanada: false },
    ],

    portalEmail: "newtonimmigration@gmail.com",
  };

  // Generate the script with the data embedded
  return `// ============================================================
// IRCC VISITOR VISA - AUTO-GENERATED FOR: ${fullName.toUpperCase()}
// Case: ${caseItem.id} | Generated: ${new Date().toLocaleDateString()}
// ⚠️  REVIEW DATA SECTION BEFORE RUNNING
// Paste on Page 1 (Purpose) of IRCC portal
// ============================================================

(async () => {

const DATA = ${JSON.stringify(data, null, 2)};

// ============================================================
// AUTO-FILL ENGINE — DO NOT EDIT BELOW
// ============================================================

const sleep = ms => new Promise(r => setTimeout(r, ms));
function ngSet(el, value) {
  if (!el) { console.warn('⚠️ Element not found'); return; }
  el.focus(); el.value = value;
  ['input','change','blur'].forEach(e => el.dispatchEvent(new Event(e, { bubbles: true })));
  console.log('✓', el.id || el.name, '=', value);
}
function waitForPage(ms = 3000) { return sleep(ms); }
function clickNext(pageNum) {
  const btn = document.getElementById('next_path');
  if (btn && btn.getAttribute('aria-disabled') !== 'true') { btn.click(); return true; }
  const i = [];
  document.querySelectorAll('.ng-invalid').forEach(el => { if (el.id) i.push(el.id + (el.value ? '=' + el.value : '')); });
  console.warn(\`⚠️ Page \${pageNum} - Next disabled. Invalid:\`, i);
  return false;
}
function clickRadio(forId, fallbackText) {
  const label = document.querySelector(\`label[for="\${forId}"]\`);
  if (label) { label.click(); return; }
  if (fallbackText) {
    const radio = [...document.querySelectorAll('input[type="radio"]')].find(r => {
      const l = document.querySelector(\`label[for="\${r.id}"]\`);
      return l && l.textContent.trim() === fallbackText;
    });
    if (radio) radio.click();
    else console.warn(\`⚠️ Radio not found: \${forId} / \${fallbackText}\`);
  }
}
function findCountryOption(selectEl, name) {
  return [...selectEl.options].find(o => o.text.toLowerCase().includes(name.toLowerCase()));
}

// PAGE 1: PURPOSE
console.log('🚀 PAGE 1: Purpose');
clickRadio('applyingFor_radio-button-464-input'); await sleep(800);
clickRadio('visaPurpose_radio-button-473-input'); await sleep(500);
ngSet(document.getElementById('visitDetails_txtArea'), DATA.visitDetails); await sleep(400);
ngSet(document.getElementById('dateComingToCanadaYear_sltDateYear'),    DATA.visitDateFrom.year);  await sleep(200);
ngSet(document.getElementById('dateComingToCanadaMonth_sltDateMonth'),  DATA.visitDateFrom.month); await sleep(200);
ngSet(document.getElementById('dateComingToCanadaDay_sltDateDay'),      DATA.visitDateFrom.day);   await sleep(300);
ngSet(document.getElementById('dateComingToCanadaToYear_sltDateYear'),  DATA.visitDateTo.year);    await sleep(200);
ngSet(document.getElementById('dateComingToCanadaToMonth_sltDateMonth'),DATA.visitDateTo.month);   await sleep(200);
ngSet(document.getElementById('dateComingToCanadaToDay_sltDateDay'),    DATA.visitDateTo.day);     await sleep(500);
if (DATA.eventCode) { const ec = document.getElementById('eventCode_input'); if (ec) { ngSet(ec, DATA.eventCode); await sleep(300); } }
if (clickNext(1)) console.log('✅ Page 1 done!'); await waitForPage();

// PAGE 2: INFO
console.log('🚀 PAGE 2: Info');
document.getElementById('next_path').click();
console.log('✅ Page 2 done!'); await waitForPage();

// PAGE 3: REPRESENTATIVE
console.log('🚀 PAGE 3: Representative');
clickRadio('hasRepresentative_radio-button-01-input'); await sleep(600);
ngSet(document.getElementById('unpaidType_select'), DATA.rep.type); await sleep(400);
ngSet(document.getElementById('unpaidTypeOther_input'), DATA.rep.typeDesc); await sleep(300);
ngSet(document.getElementById('lastName_input'),  DATA.rep.lastName);  await sleep(200);
ngSet(document.getElementById('firstName_input'), DATA.rep.firstName); await sleep(200);
clickRadio('telType_phoneNumberRep_radio-button-02-input'); await sleep(300);
clickRadio('telLocation_phoneNumberRep_radio-button-01-input'); await sleep(300);
ngSet(document.getElementById('telNumber_phoneNumberRep'), DATA.rep.phone); await sleep(200);
ngSet(document.getElementById('emailContactInfo_input'),       DATA.rep.email); await sleep(200);
ngSet(document.getElementById('emailContactInfoRepeat_input'), DATA.rep.email); await sleep(300);
const repCountry = document.getElementById('country_representativeAddress');
ngSet(repCountry, findCountryOption(repCountry, 'canada').value); await sleep(800);
const manualBtn = [...document.querySelectorAll('button, a, span, div, p')].find(el => el.textContent.trim().toLowerCase().includes('manually'));
if (manualBtn) { manualBtn.click(); console.log('✓ Clicked manually input address'); }
await sleep(800);
ngSet(document.getElementById('province_representativeAddress'),   DATA.rep.province);  await sleep(300);
ngSet(document.getElementById('streetNum_representativeAddress'), DATA.rep.streetNum); await sleep(200);
ngSet(document.getElementById('street_representativeAddress'),    DATA.rep.street);    await sleep(200);
ngSet(document.getElementById('city_representativeAddress'),      DATA.rep.city);      await sleep(200);
ngSet(document.getElementById('postalcode_representativeAddress'),DATA.rep.postal);    await sleep(500);
if (clickNext(3)) console.log('✅ Page 3 done!'); await waitForPage();

// PAGE 4: TRAVEL DOC INFO
console.log('🚀 PAGE 4: Travel Doc Info');
ngSet(document.getElementById('lastName_input'),  DATA.lastName);  await sleep(200);
ngSet(document.getElementById('firstName_input'), DATA.firstName); await sleep(200);
ngSet(document.getElementById('year_sltDateYear'),   DATA.dob.year);  await sleep(200);
ngSet(document.getElementById('month_sltDateMonth'), DATA.dob.month); await sleep(200);
ngSet(document.getElementById('day_sltDateDay'),     DATA.dob.day);   await sleep(300);
clickRadio(DATA.gender === 'male' ? 'gender_radio-button-01-input' : 'gender_radio-button-02-input'); await sleep(400);
if (clickNext(4)) console.log('✅ Page 4 done!'); await waitForPage();

// PAGE 5: TRAVEL DOCUMENT
console.log('🚀 PAGE 5: Travel Document');
clickRadio('travelDocument_radio-button-249-input'); await sleep(400);
clickRadio('passportType_radio-button-099-input'); await sleep(300);
const codeSelect = document.getElementById('codePassport_select');
const passCode = [...codeSelect.options].find(o => o.text.includes(DATA.passportCountry));
if (passCode) ngSet(codeSelect, passCode.value); await sleep(300);
const natSelect = document.getElementById('nationalityPassport_select');
const natOpt = findCountryOption(natSelect, DATA.passportNat);
if (natOpt) ngSet(natSelect, natOpt.value); await sleep(300);
ngSet(document.getElementById('travelDocNum_input'),             DATA.passportNumber); await sleep(200);
ngSet(document.getElementById('travelDocNumConfirmation_input'), DATA.passportNumber); await sleep(200);
ngSet(document.getElementById('dateIssuePassportDay_sltDateDay'),      DATA.passportIssued.day);   await sleep(200);
ngSet(document.getElementById('dateIssuePassportMonth_sltDateMonth'),  DATA.passportIssued.month); await sleep(200);
ngSet(document.getElementById('dateIssuePassportYear_sltDateYear'),    DATA.passportIssued.year);  await sleep(300);
ngSet(document.getElementById('dateExpiryPassportDay_sltDateDay'),     DATA.passportExpiry.day);   await sleep(200);
ngSet(document.getElementById('dateExpiryPassportMonth_sltDateMonth'), DATA.passportExpiry.month); await sleep(200);
ngSet(document.getElementById('dateExpiryPassportYear_sltDateYear'),   DATA.passportExpiry.year);  await sleep(300);
clickRadio('hasGreenCard_radio-button-02-input', 'No'); await sleep(300);
clickRadio('travelledToCanadaInPastTen_radio-button-02-input', 'No'); await sleep(300);
clickRadio('holdUSVisa_radio-button-02-input', 'No'); await sleep(300);
clickRadio('travellingByAir_radio-button-01-input', 'Yes'); await sleep(500);
if (clickNext(5)) console.log('✅ Page 5 done!'); await waitForPage();

// PAGE 6: CITIZENSHIP
console.log('🚀 PAGE 6: Citizenship');
const cb6 = document.getElementById('countryBirth_select');
ngSet(cb6, findCountryOption(cb6, DATA.birthCountry).value); await sleep(300);
ngSet(document.getElementById('cityBirth_input'), DATA.birthCity); await sleep(200);
clickRadio('citizenshipOfCountryOrTerritory_radio-button-02-input'); await sleep(400);
const cc6 = document.getElementById('countryOfCitizenship_select');
ngSet(cc6, findCountryOption(cc6, DATA.citizenshipCountry).value); await sleep(300);
ngSet(document.getElementById('citizenFromYear_sltDateYear'),   DATA.citizenshipFrom.year);  await sleep(200);
ngSet(document.getElementById('citizenFromMonth_sltDateMonth'), DATA.citizenshipFrom.month); await sleep(200);
ngSet(document.getElementById('citizenFromDay_sltDateDay'),     DATA.citizenshipFrom.day);   await sleep(300);
if (clickNext(6)) console.log('✅ Page 6 done!'); await waitForPage();

// PAGE 7: NATIONAL ID
console.log('🚀 PAGE 7: National ID');
clickRadio('hasNationality_radio-button-02-input', 'No'); await sleep(500);
if (clickNext(7)) console.log('✅ Page 7 done!'); await waitForPage();

// PAGE 8: US GREEN CARD
console.log('🚀 PAGE 8: US Green Card');
clickRadio('hasUSResidentCard_radio-button-02-input', 'No'); await sleep(500);
if (clickNext(8)) console.log('✅ Page 8 done!'); await waitForPage();

// PAGE 9: CONTACT ADDRESS
console.log('🚀 PAGE 9: Contact Address');
const ac9 = document.getElementById('country_contactAddress');
ngSet(ac9, findCountryOption(ac9, DATA.addressCountry).value); await sleep(600);
const mb9 = [...document.querySelectorAll('button, a')].find(el => el.textContent.trim().toLowerCase().includes('manually'));
if (mb9) { mb9.click(); await sleep(600); }
ngSet(document.getElementById('streetAddress_contactAddress'), DATA.addressStreet); await sleep(200);
ngSet(document.getElementById('city_contactAddress'), DATA.addressCity); await sleep(200);
if (DATA.addressPostal) { ngSet(document.getElementById('postalcode_contactAddress'), DATA.addressPostal); await sleep(200); }
if (clickNext(9)) console.log('✅ Page 9 done!'); await waitForPage();

// PAGE 10: RESIDENCES
console.log('🚀 PAGE 10: Residences');
for (let i = 0; i < DATA.residences.length; i++) {
  const res = DATA.residences[i];
  document.getElementById('residenceHistoryRecords_add_button').click(); await sleep(800);
  const rcs = document.getElementById('residenceCountry_select');
  ngSet(rcs, findCountryOption(rcs, res.country).value); await sleep(400);
  ngSet(document.getElementById('statusInCountry_select'), res.status); await sleep(300);
  ngSet(document.getElementById('fromResidenceYear_sltDateYear'),   res.from.year);  await sleep(200);
  ngSet(document.getElementById('fromResidenceMonth_sltDateMonth'), res.from.month); await sleep(200);
  ngSet(document.getElementById('fromResidenceDay_sltDateDay'),     res.from.day);   await sleep(200);
  if (res.currentlyLive) {
    const cl = document.getElementById('isCurrentResidence_chk-input');
    if (cl && !cl.checked) cl.click(); await sleep(300);
  } else {
    ngSet(document.getElementById('toResidenceYear_sltDateYear'),   res.to.year);  await sleep(200);
    ngSet(document.getElementById('toResidenceMonth_sltDateMonth'), res.to.month); await sleep(200);
    ngSet(document.getElementById('toResidenceDay_sltDateDay'),     res.to.day);   await sleep(200);
  }
  document.getElementById('residenceHistory_save_button').click(); await sleep(800);
}
if (clickNext(10)) console.log('✅ Page 10 done!'); await waitForPage();

// PAGE 11: CONTACT DETAILS (funds)
console.log('🚀 PAGE 11: Contact/Funds');
ngSet(document.getElementById('fundsAvailableToUse_input'), DATA.funds); await sleep(200);
clickRadio(DATA.fundsShared ? 'fundsAreSufficientForVisit_radio-button-01-input' : 'fundsAreSufficientForVisit_radio-button-02-input'); await sleep(300);
if (clickNext(11)) console.log('✅ Page 11 done!'); await waitForPage();

// PAGE 12: INVITER / CONTACT IN CANADA
console.log('🚀 PAGE 12: Inviter');
clickRadio('hasContactInCanada_radio-button-01-input', 'Yes'); await sleep(500);
const relSel = document.getElementById('contactRelationship_select');
ngSet(relSel, DATA.inviter.relation); await sleep(300);
if (DATA.inviter.orgName) { ngSet(document.getElementById('nameOfOrganization_input'), DATA.inviter.orgName); await sleep(200); }
ngSet(document.getElementById('lastName_input'),  DATA.inviter.lastName);  await sleep(200);
ngSet(document.getElementById('firstName_input'), DATA.inviter.firstName); await sleep(200);
const ipc = document.getElementById('country_inviterAddress');
if (ipc) { ngSet(ipc, findCountryOption(ipc, 'canada').value); await sleep(500); }
const imb = [...document.querySelectorAll('button, a')].find(el => el.textContent.trim().toLowerCase().includes('manually'));
if (imb) { imb.click(); await sleep(600); }
ngSet(document.getElementById('province_inviterAddress'), DATA.inviter.province); await sleep(300);
ngSet(document.getElementById('streetNum_inviterAddress'), DATA.inviter.streetNum); await sleep(200);
ngSet(document.getElementById('street_inviterAddress'), DATA.inviter.street); await sleep(200);
if (DATA.inviter.apt) ngSet(document.getElementById('apt_inviterAddress'), DATA.inviter.apt);
ngSet(document.getElementById('city_inviterAddress'), DATA.inviter.city); await sleep(200);
ngSet(document.getElementById('postalcode_inviterAddress'), DATA.inviter.postal); await sleep(300);
if (clickNext(12)) console.log('✅ Page 12 done!'); await waitForPage();

// PAGE 13: EDUCATION
console.log('🚀 PAGE 13: Education');
for (let i = 0; i < DATA.education.length; i++) {
  const edu = DATA.education[i];
  document.getElementById('educationRecords_add_button').click(); await sleep(800);
  ngSet(document.getElementById('schoolName_input'), edu.school); await sleep(200);
  ngSet(document.getElementById('fromEduYear_sltDateYear'),   edu.from.year);  await sleep(200);
  ngSet(document.getElementById('fromEduMonth_sltDateMonth'), edu.from.month); await sleep(200);
  ngSet(document.getElementById('toEduYear_sltDateYear'),   edu.to.year);  await sleep(200);
  ngSet(document.getElementById('toEduMonth_sltDateMonth'), edu.to.month); await sleep(200);
  ngSet(document.getElementById('levelOfStudy_select'), edu.level); await sleep(300);
  ngSet(document.getElementById('fieldOfStudy_select'), edu.field); await sleep(300);
  const ecs = document.getElementById('country_educationAddress');
  ngSet(ecs, findCountryOption(ecs, edu.country).value); await sleep(400);
  ngSet(document.getElementById('streetAddress_educationAddress'), edu.street); await sleep(200);
  ngSet(document.getElementById('city_educationAddress'), edu.city); await sleep(200);
  document.getElementById('educationRecord_save_button').click(); await sleep(800);
}
if (clickNext(13)) console.log('✅ Page 13 done!'); await waitForPage();

// PAGE 14: EMPLOYMENT
console.log('🚀 PAGE 14: Employment');
for (let i = 0; i < DATA.employment.length; i++) {
  const emp = DATA.employment[i];
  document.getElementById('workHistoryRecords_add_button').click(); await sleep(800);
  ngSet(document.getElementById('fromWorkYear_sltDateYear'),   emp.from.year);  await sleep(200);
  ngSet(document.getElementById('fromWorkMonth_sltDateMonth'), emp.from.month); await sleep(200);
  if (emp.to === null) {
    const oe = document.getElementById('isCurrentEmployer_chk-input');
    if (oe && !oe.checked) oe.click(); await sleep(400);
  } else {
    ngSet(document.getElementById('toWorkYear_sltDateYear'),   emp.to.year);  await sleep(200);
    ngSet(document.getElementById('toWorkMonth_sltDateMonth'), emp.to.month); await sleep(200);
  }
  ngSet(document.getElementById('activtyOccupation_select'), emp.occupation); await sleep(400);
  if (emp.jobTitle) { ngSet(document.getElementById('jobTitleActivity_select'), emp.jobTitle); await sleep(300); }
  if (emp.employer) { ngSet(document.getElementById('nameEmployerActivity_input'), emp.employer); await sleep(200); }
  if (emp.duties)   { ngSet(document.getElementById('responsibilityActivity_input'), emp.duties); await sleep(200); }
  const wcSel = document.getElementById('country_workHistoryAddress');
  ngSet(wcSel, findCountryOption(wcSel, emp.country).value); await sleep(400);
  ngSet(document.getElementById('streetAddress_workHistoryAddress'), emp.street); await sleep(200);
  ngSet(document.getElementById('city_workHistoryAddress'), emp.city); await sleep(200);
  document.getElementById('fromWork_save_button').click(); await sleep(800);
}
if (clickNext(14)) console.log('✅ Page 14 done!'); await waitForPage();

// PAGE 15: TRAVEL HISTORY
console.log('🚀 PAGE 15: Travel History');
if (DATA.travel.length > 0) {
  clickRadio('traveledToOtherCountries_radio-button-01-input', 'Yes'); await sleep(600);
  for (let i = 0; i < DATA.travel.length; i++) {
    const t = DATA.travel[i];
    document.getElementById('travelHistoryRecords_add_button').click(); await sleep(800);
    ngSet(document.getElementById('fromtravelHistoryYear_sltDateYear'),   t.fromY); await sleep(200);
    ngSet(document.getElementById('fromtravelHistoryMonth_sltDateMonth'), t.fromM); await sleep(200);
    ngSet(document.getElementById('totravelHistoryYear_sltDateYear'),     t.toY);   await sleep(200);
    ngSet(document.getElementById('totravelHistoryMonth_sltDateMonth'),   t.toM);   await sleep(200);
    const tcs = document.getElementById('travelHistoryCountry_select');
    const tco = findCountryOption(tcs, t.country);
    if (tco) ngSet(tcs, tco.value); else console.warn('⚠️ Travel country not found:', t.country);
    await sleep(300);
    ngSet(document.getElementById('travelHistoryLocation_input'),        t.location); await sleep(200);
    ngSet(document.getElementById('travelHistoryPurposeOfTravel_input'), t.purpose);  await sleep(200);
    document.getElementById('fromtravelHistory_save_button').click();
    await sleep(800);
  }
} else {
  clickRadio('traveledToOtherCountries_radio-button-02-input', 'No'); await sleep(500);
}
if (clickNext(15)) console.log('✅ Page 15 done!'); await waitForPage();

// PAGES 16-21: TRAVEL CONTINUED + CRIMINALITY + MEDICAL
for (let p = 16; p <= 16; p++) {
  console.log(\`🚀 PAGE \${p}: Travel Continued\`);
  clickRadio('remainedBeyondValidity_radio-button-02-input', 'No'); await sleep(300);
  clickRadio('refusedVisaInOtherCountry_radio-button-02-input', 'No'); await sleep(500);
  if (clickNext(p)) console.log(\`✅ Page \${p} done!\`); await waitForPage();
}
for (let p = 17; p <= 21; p++) {
  console.log(\`🚀 PAGE \${p}: Background\`);
  document.querySelectorAll('input[type="radio"]').forEach(r => {
    const l = document.querySelector(\`label[for="\${r.id}"]\`);
    if (l && l.textContent.trim() === 'No') r.click();
  });
  await sleep(500);
  if (clickNext(p)) console.log(\`✅ Page \${p} done!\`); await waitForPage();
}

// PAGE 22: MARITAL STATUS
console.log('🚀 PAGE 22: Marital Status');
clickRadio(\`currentMaritalStatus_radio-button-\${DATA.maritalStatus}-input\`); await sleep(500);
if (clickNext(22)) console.log('✅ Page 22 done!'); await waitForPage();

// PAGE 23: CHILDREN
console.log('🚀 PAGE 23: Children');
if (!DATA.hasChildren) {
  clickRadio('hasChild_radio-button-02-input', 'No'); await sleep(400);
  const dcc = document.getElementById('declaringChildren_chk-input');
  if (dcc && !dcc.checked) dcc.click(); await sleep(500);
}
if (clickNext(23)) console.log('✅ Page 23 done!'); await waitForPage();

// PAGE 24: PARENTS
console.log('🚀 PAGE 24: Parents');
for (const p of DATA.parents) {
  document.getElementById('parentInfoGrid_add_button').click(); await sleep(800);
  ngSet(document.getElementById('lastName_input'),  p.lastName);  await sleep(200);
  ngSet(document.getElementById('firstName_input'), p.firstName); await sleep(200);
  const rs = document.getElementById('relationshipParents_select');
  ngSet(rs, [...rs.options].find(o => o.text.toLowerCase().includes(p.rel)).value); await sleep(300);
  ngSet(document.getElementById('dateOfBirthYear_sltDateYear'),  p.dob.year);  await sleep(200);
  ngSet(document.getElementById('dateOfBirthMonth_sltDateMonth'),p.dob.month); await sleep(200);
  ngSet(document.getElementById('dateOfBirthDay_sltDateDay'),    p.dob.day);   await sleep(300);
  const pcs = document.getElementById('parentCountryOfBirth_select');
  ngSet(pcs, findCountryOption(pcs, p.birthCountry).value); await sleep(300);
  ngSet(document.getElementById('parentOccupation_input'), p.occupation); await sleep(200);
  if (p.sameAddress) {
    clickRadio('addressParent_radio-button-01-input', 'Yes'); await sleep(300);
  } else {
    clickRadio('addressParent_radio-button-02-input', 'No'); await sleep(500);
    const ac = document.getElementById('country_residentialAddress');
    if (ac) { ngSet(ac, findCountryOption(ac, p.addrCountry).value); await sleep(400); }
    const as = document.getElementById('streetAddress_residentialAddress');
    if (as) { ngSet(as, p.addrStreet); await sleep(200); }
    const aci = document.getElementById('city_residentialAddress');
    if (aci) { ngSet(aci, p.addrCity); await sleep(200); }
  }
  clickRadio(p.comingToCanada ? 'parentComingCanada_radio-button-01-input' : 'parentComingCanada_radio-button-02-input', p.comingToCanada ? 'Yes' : 'No'); await sleep(400);
  const saveBtn = document.getElementById('name_save_button') || [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLowerCase() === 'save');
  if (saveBtn) { saveBtn.click(); console.log('✓ Saved parent:', p.lastName); }
  await sleep(1000);
}
if (clickNext(24)) console.log('✅ Page 24 done!'); await waitForPage();

// PAGE 25: LANGUAGE
console.log('🚀 PAGE 25: Language');
ngSet(document.getElementById('selectNativeLanguage_select'), DATA.nativeLanguage); await sleep(300);
clickRadio(\`knowLanguage_radio-button-\${DATA.knowEnglishFrench}-input\`); await sleep(300);
clickRadio(\`preferredLanguage_radio-button-\${DATA.preferredLang}-input\`); await sleep(500);
if (clickNext(25)) console.log('✅ Page 25 done!'); await waitForPage();

// PAGE 26: EMAIL
console.log('🚀 PAGE 26: Email');
ngSet(document.getElementById('emailContactInfo_input'),             DATA.portalEmail); await sleep(200);
ngSet(document.getElementById('emailConfirmationContactInfo_input'), DATA.portalEmail); await sleep(500);
if (clickNext(26)) console.log('✅ Page 26 done!'); await waitForPage();

// PAGE 27: TELEPHONE
console.log('🚀 PAGE 27: Telephone');
const addTel = [...document.querySelectorAll('button')].find(b => b.textContent.trim().toLowerCase().includes('add'));
if (addTel) { addTel.click(); await sleep(800); }
clickRadio('telType_telNumContactInfo_radio-button-02-input', 'Cellular'); await sleep(300);
clickRadio('telLocation_telNumContactInfo_radio-button-02-input', 'Other'); await sleep(400);
ngSet(document.getElementById('telCountryCode_telNumContactInfo'), DATA.phoneCountryCode); await sleep(200);
ngSet(document.getElementById('telNumber_telNumContactInfo'),      DATA.phone);            await sleep(300);
document.getElementById('telNumContactInfo_save_button').click(); await sleep(800);
if (clickNext(27)) console.log('✅ Page 27 done!');

console.log('🎉 ALL DONE! Review the Summary page before submitting.');

})();`;
}
