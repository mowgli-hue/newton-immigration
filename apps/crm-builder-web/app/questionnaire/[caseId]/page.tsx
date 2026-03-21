"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveApplicationChecklistKey } from "@/lib/application-checklists";

type CaseMessage = {
  id: string;
  senderType: "client" | "staff" | "ai";
  senderName: string;
  text: string;
  createdAt: string;
};

type EmploymentEntry = {
  from: string;
  to: string;
  position: string;
  employer: string;
  location: string;
};

type TravelEntry = {
  country: string;
  status: string;
  from: string;
  to: string;
  details: string;
};

type EducationEntry = {
  from: string;
  to: string;
  fieldOfStudy: string;
  institute: string;
  city: string;
};

type IntakeForm = {
  fullName: string;
  applicationType: string;
  applicationSpecificAnswers: string;
  intendedWorkDetails: string;
  usedOtherName: string;
  otherNameDetails: string;
  currentCountry: string;
  currentCountryStatus: string;
  currentCountryFromDate: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirthCity: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  countryOfBirth: string;
  citizenship: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  uci: string;
  maritalStatus: string;
  spouseName: string;
  nativeLanguage: string;
  canCommunicateEnglishFrench: string;
  preferredLanguage: string;
  education: string;
  educationDetails: string;
  permitDetails: string;
  studyPermitExpiryDate: string;
  spouseDateOfMarriage: string;
  previousMarriageCommonLaw: string;
  previousRelationshipDetails: string;
  residentialAddress: string;
  travelHistorySixMonths: string;
  travelHistoryDetails: string;
  englishTestTaken: string;
  recentEntryAny: string;
  dliNameLocation: string;
  programNameDuration: string;
  completionLetterDate: string;
  fullTimeStudentThroughout: string;
  gapsOrPartTimeDetails: string;
  previousCollegesInCanada: string;
  academicProbationOrTransfer: string;
  employmentHistory: string;
  originalEntryDate: string;
  originalEntryPlacePurpose: string;
  recentEntryDetails: string;
  ieltsDetails: string;
  refusedAnyCountry: string;
  refusalDetails: string;
  criminalHistory: string;
  medicalHistory: string;
  additionalNotes: string;
};

const EMPTY_FORM: IntakeForm = {
  fullName: "",
  applicationType: "PGWP",
  applicationSpecificAnswers: "",
  intendedWorkDetails: "",
  usedOtherName: "",
  otherNameDetails: "",
  currentCountry: "Canada",
  currentCountryStatus: "",
  currentCountryFromDate: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  placeOfBirthCity: "",
  passportNumber: "",
  passportIssueDate: "",
  passportExpiryDate: "",
  countryOfBirth: "",
  citizenship: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  uci: "",
  maritalStatus: "",
  spouseName: "",
  nativeLanguage: "",
  canCommunicateEnglishFrench: "",
  preferredLanguage: "English",
  education: "",
  educationDetails: "",
  permitDetails: "",
  studyPermitExpiryDate: "",
  spouseDateOfMarriage: "",
  previousMarriageCommonLaw: "",
  previousRelationshipDetails: "",
  residentialAddress: "",
  travelHistorySixMonths: "",
  travelHistoryDetails: "",
  englishTestTaken: "",
  recentEntryAny: "",
  dliNameLocation: "",
  programNameDuration: "",
  completionLetterDate: "",
  fullTimeStudentThroughout: "",
  gapsOrPartTimeDetails: "",
  previousCollegesInCanada: "",
  academicProbationOrTransfer: "",
  employmentHistory: "",
  originalEntryDate: "",
  originalEntryPlacePurpose: "",
  recentEntryDetails: "",
  ieltsDetails: "",
  refusedAnyCountry: "",
  refusalDetails: "",
  criminalHistory: "",
  medicalHistory: "",
  additionalNotes: ""
};

const APPLICATION_PROMPTS: Record<string, string[]> = {
  pgwp: [
    "Have you used any other name? (Yes/No, details if yes)",
    "Current marital status",
    "If married/common-law: spouse full name and date of marriage",
    "Any previous marriage/common-law? (details if yes)",
    "Current mailing address and phone number",
    "Date/place/purpose of first entry to Canada",
    "Any recent entry to Canada? (date + reason)",
    "Any refusal, criminal history, or medical history? (details if yes)",
    "Employment history (include foreign experience)",
    "Education after 12th (if any)"
  ],
  trv_inside: [
    "Have you used any other name? (Yes/No, details if yes)",
    "Current marital status and spouse details (if applicable)",
    "Current mailing/residential address and phone",
    "Any refusal, criminal history, or medical history? (details if yes)",
    "Employment history",
    "Education after 12th",
    "Name/relationship/address of person you will visit in Canada",
    "Funds available and who will pay expenses"
  ],
  visitor_visa: [
    "Have you used any other name? (Yes/No, details if yes)",
    "Current marital status and spouse details",
    "Countries lived in during past 5 years",
    "Post-secondary studies details",
    "Military/police/security service history",
    "Employment and activities in last 10 years",
    "Travel history in last 5 years",
    "Refusal/criminal/medical history details",
    "Parents and children details"
  ],
  visitor_record: [
    "Current status in Canada and expiry details",
    "Reason for extension and requested duration",
    "Current address and phone number",
    "Proof of funds summary",
    "Any refusal/criminal/medical issues? (details if yes)"
  ],
  work_permit: [
    "Have you used any other name? (Yes/No, details if yes)",
    "Current marital status and spouse details",
    "Current mailing/residential address and phone",
    "Date/place/purpose of first entry to Canada",
    "Any recent entry to Canada? (date + reason)",
    "Any refusal, criminal history, or medical history? (details if yes)",
    "Employment details (all positions, most recent first)",
    "Education after 12th (if any)",
    "Native language and English test status"
  ],
  study_permit: [
    "Have you used any other name? (Yes/No, details if yes)",
    "Current marital status and spouse details",
    "Current mailing/residential address and phone",
    "Any refusal, criminal history, or medical history? (details if yes)",
    "Employment details",
    "Education details after 12th",
    "Native language"
  ],
  study_permit_extension: [
    "Current permit details and expiry",
    "Current institution + enrollment details",
    "Reason for extension/college change",
    "Address and phone details",
    "Any refusal/criminal/medical issues? (details if yes)"
  ],
  super_visa: [
    "Have you used any other name? (Yes/No, details if yes)",
    "Current marital status and spouse details",
    "Current mailing/residential address and phone",
    "Any refusal, criminal history, or medical history? (details if yes)",
    "Employment and education details",
    "Native language",
    "Family info (spouse/children/parents)"
  ],
  us_b1b2: [
    "Purpose of US trip and intended dates",
    "US contact details (if any)",
    "Family information (parents/spouse)",
    "Employment/education/training details",
    "Travel history + past refusals/overstays",
    "Security background answers"
  ],
  uk_visitor: [
    "Address history (past 2 years)",
    "Current activity/work/study details",
    "Estimated monthly living expenses",
    "Travel purpose and intended UK arrival date",
    "Family details and UK relatives",
    "Travel/refusal/criminal/medical history"
  ],
  refugee: [
    "Other names used (if any)",
    "Current address, phone, email, and language details",
    "Marital/spouse/previous relationship details",
    "Parents/siblings/children details",
    "Address history last 10 years",
    "Employment/activity history last 10 years",
    "Travel history last 5 years",
    "Detailed refugee claim narrative (incidents, dates, threats)"
  ],
  canadian_passport_doc: [
    "Any previous names used?",
    "Eye color and height (cm)",
    "Address history (past 2 years)",
    "Occupation history (past 2 years)",
    "Guarantor details",
    "Two references and emergency contact details"
  ],
  generic: [
    "Please provide all key details relevant to this application",
    "Any refusals, criminal, or medical history?",
    "Any additional notes for your case team?"
  ]
};

function parseSpecificAnswers(raw: string, prompts: string[]): Record<string, string> {
  const base: Record<string, string> = {};
  for (const p of prompts) base[p] = "";
  if (!raw.trim()) return base;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const p of prompts) base[p] = String(parsed[p] || "");
    return base;
  } catch {
    return base;
  }
}

function serializeSpecificAnswers(values: Record<string, string>, prompts: string[]): string {
  const out: Record<string, string> = {};
  for (const p of prompts) out[p] = String(values[p] || "").trim();
  return JSON.stringify(out);
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mt-4 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-900">{title}</h2>;
}

function emptyEmploymentEntry(): EmploymentEntry {
  return { from: "", to: "", position: "", employer: "", location: "" };
}

function parseEmploymentHistory(raw: string): EmploymentEntry[] {
  const lines = String(raw || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [emptyEmploymentEntry()];

  const parsed = lines.map((line) => {
    const entry = emptyEmploymentEntry();
    const parts = line.split("|").map((p) => p.trim());
    for (const part of parts) {
      const [k, ...rest] = part.split(":");
      const key = String(k || "").trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key.startsWith("from")) entry.from = value;
      if (key.startsWith("to")) entry.to = value;
      if (key.startsWith("position")) entry.position = value;
      if (key.startsWith("employer")) entry.employer = value;
      if (key.startsWith("location")) entry.location = value;
    }
    return entry;
  });
  return parsed.length > 0 ? parsed : [emptyEmploymentEntry()];
}

function toEmploymentHistoryText(entries: EmploymentEntry[]): string {
  return entries
    .map((e) => ({
      from: e.from.trim(),
      to: e.to.trim(),
      position: e.position.trim(),
      employer: e.employer.trim(),
      location: e.location.trim()
    }))
    .filter((e) => e.from || e.to || e.position || e.employer || e.location)
    .map(
      (e) =>
        `From: ${e.from || "N/A"} | To: ${e.to || "N/A"} | Position: ${e.position || "N/A"} | Employer: ${e.employer || "N/A"} | Location: ${e.location || "N/A"}`
    )
    .join("\n");
}

function emptyTravelEntry(): TravelEntry {
  return { country: "", status: "", from: "", to: "", details: "" };
}

function parseTravelHistory(raw: string): TravelEntry[] {
  const lines = String(raw || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [emptyTravelEntry()];

  const parsed = lines.map((line) => {
    const entry = emptyTravelEntry();
    const parts = line.split("|").map((p) => p.trim());
    for (const part of parts) {
      const [k, ...rest] = part.split(":");
      const key = String(k || "").trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key.startsWith("country")) entry.country = value;
      if (key.startsWith("status")) entry.status = value;
      if (key === "from") entry.from = value;
      if (key === "to") entry.to = value;
      if (key.startsWith("details") || key.startsWith("other")) entry.details = value;
    }
    return entry;
  });
  return parsed.length > 0 ? parsed : [emptyTravelEntry()];
}

function toTravelHistoryText(entries: TravelEntry[]): string {
  return entries
    .map((e) => ({
      country: e.country.trim(),
      status: e.status.trim(),
      from: e.from.trim(),
      to: e.to.trim(),
      details: e.details.trim()
    }))
    .filter((e) => e.country || e.status || e.from || e.to || e.details)
    .map(
      (e) =>
        `Country: ${e.country || "N/A"} | Status: ${e.status || "N/A"} | From: ${e.from || "N/A"} | To: ${e.to || "N/A"} | Details: ${e.details || "N/A"}`
    )
    .join("\n");
}

function emptyEducationEntry(): EducationEntry {
  return { from: "", to: "", fieldOfStudy: "", institute: "", city: "" };
}

function parseEducationHistory(raw: string): EducationEntry[] {
  const lines = String(raw || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [emptyEducationEntry()];

  const parsed = lines.map((line) => {
    const entry = emptyEducationEntry();
    const parts = line.split("|").map((p) => p.trim());
    for (const part of parts) {
      const [k, ...rest] = part.split(":");
      const key = String(k || "").trim().toLowerCase();
      const value = rest.join(":").trim();
      if (key === "from") entry.from = value;
      if (key === "to") entry.to = value;
      if (key.includes("field")) entry.fieldOfStudy = value;
      if (key.includes("institute")) entry.institute = value;
      if (key === "city") entry.city = value;
    }
    return entry;
  });
  return parsed.length > 0 ? parsed : [emptyEducationEntry()];
}

function toEducationHistoryText(entries: EducationEntry[]): string {
  return entries
    .map((e) => ({
      from: e.from.trim(),
      to: e.to.trim(),
      fieldOfStudy: e.fieldOfStudy.trim(),
      institute: e.institute.trim(),
      city: e.city.trim()
    }))
    .filter((e) => e.from || e.to || e.fieldOfStudy || e.institute || e.city)
    .map(
      (e) =>
        `From: ${e.from || "N/A"} | To: ${e.to || "N/A"} | Field: ${e.fieldOfStudy || "N/A"} | Institute: ${e.institute || "N/A"} | City: ${e.city || "N/A"}`
    )
    .join("\n");
}

export default function QuestionnairePage({ params }: { params: { caseId: string } }) {
  const [form, setForm] = useState<IntakeForm>(EMPTY_FORM);
  const [employmentEntries, setEmploymentEntries] = useState<EmploymentEntry[]>([emptyEmploymentEntry()]);
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([emptyTravelEntry()]);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([emptyEducationEntry()]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantStatus, setAssistantStatus] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<CaseMessage[]>([]);
  const [specificAnswers, setSpecificAnswers] = useState<Record<string, string>>({});
  const appKey = useMemo(() => resolveApplicationChecklistKey(form.applicationType || "generic"), [form.applicationType]);
  const appPrompts = useMemo(() => APPLICATION_PROMPTS[appKey] || APPLICATION_PROMPTS.generic, [appKey]);

  async function loadAssistantMessages() {
    const res = await fetch(`/api/cases/${params.caseId}/messages`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const list = (payload.messages || []) as CaseMessage[];
    setAssistantMessages(list.slice(-12));
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch(`/api/cases/${params.caseId}/intake`, { cache: "no-store" });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus(String(payload.error || "Could not load intake"));
          return;
        }
        const nextForm = { ...EMPTY_FORM, ...(payload.intake || {}) };
        const serverFormType = String(payload.formType || "").trim();
        if (serverFormType && !nextForm.applicationType) {
          nextForm.applicationType = serverFormType;
        } else if (serverFormType) {
          nextForm.applicationType = serverFormType;
        }
        setForm(nextForm);
        setEmploymentEntries(parseEmploymentHistory(String(nextForm.employmentHistory || "")));
        setTravelEntries(parseTravelHistory(String(nextForm.travelHistoryDetails || "")));
        setEducationEntries(parseEducationHistory(String(nextForm.educationDetails || "")));
        const promptList = APPLICATION_PROMPTS[resolveApplicationChecklistKey(nextForm.applicationType || "generic")] || APPLICATION_PROMPTS.generic;
        setSpecificAnswers(parseSpecificAnswers(String(nextForm.applicationSpecificAnswers || ""), promptList));
        await loadAssistantMessages();
      } catch {
        setStatus("Could not load intake");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.caseId]);

  function updateField<K extends keyof IntakeForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    setSpecificAnswers((prev) => {
      const next: Record<string, string> = {};
      for (const p of appPrompts) next[p] = String(prev[p] || "");
      setForm((current) => ({
        ...current,
        applicationSpecificAnswers: serializeSpecificAnswers(next, appPrompts)
      }));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  function updateEmploymentEntry(index: number, key: keyof EmploymentEntry, value: string) {
    setEmploymentEntries((prev) => {
      const next = prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry));
      setForm((current) => ({ ...current, employmentHistory: toEmploymentHistoryText(next) }));
      return next;
    });
  }

  function addEmploymentRow() {
    setEmploymentEntries((prev) => {
      const next = [...prev, emptyEmploymentEntry()];
      setForm((current) => ({ ...current, employmentHistory: toEmploymentHistoryText(next) }));
      return next;
    });
  }

  function removeEmploymentRow(index: number) {
    setEmploymentEntries((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const next = filtered.length > 0 ? filtered : [emptyEmploymentEntry()];
      setForm((current) => ({ ...current, employmentHistory: toEmploymentHistoryText(next) }));
      return next;
    });
  }

  function updateTravelEntry(index: number, key: keyof TravelEntry, value: string) {
    setTravelEntries((prev) => {
      const next = prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry));
      setForm((current) => ({ ...current, travelHistoryDetails: toTravelHistoryText(next) }));
      return next;
    });
  }

  function addTravelRow() {
    setTravelEntries((prev) => {
      const next = [...prev, emptyTravelEntry()];
      setForm((current) => ({ ...current, travelHistoryDetails: toTravelHistoryText(next) }));
      return next;
    });
  }

  function removeTravelRow(index: number) {
    setTravelEntries((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const next = filtered.length > 0 ? filtered : [emptyTravelEntry()];
      setForm((current) => ({ ...current, travelHistoryDetails: toTravelHistoryText(next) }));
      return next;
    });
  }

  function updateEducationEntry(index: number, key: keyof EducationEntry, value: string) {
    setEducationEntries((prev) => {
      const next = prev.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry));
      setForm((current) => ({ ...current, educationDetails: toEducationHistoryText(next) }));
      return next;
    });
  }

  function updateSpecificAnswer(prompt: string, value: string) {
    setSpecificAnswers((prev) => {
      const next = { ...prev, [prompt]: value };
      setForm((current) => ({
        ...current,
        applicationSpecificAnswers: serializeSpecificAnswers(next, appPrompts)
      }));
      return next;
    });
  }

  function addEducationRow() {
    setEducationEntries((prev) => {
      const next = [...prev, emptyEducationEntry()];
      setForm((current) => ({ ...current, educationDetails: toEducationHistoryText(next) }));
      return next;
    });
  }

  function removeEducationRow(index: number) {
    setEducationEntries((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const next = filtered.length > 0 ? filtered : [emptyEducationEntry()];
      setForm((current) => ({ ...current, educationDetails: toEducationHistoryText(next) }));
      return next;
    });
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");
    const payloadForm = {
      ...form,
      applicationSpecificAnswers: serializeSpecificAnswers(specificAnswers, appPrompts)
    };
    const res = await fetch(`/api/cases/${params.caseId}/intake`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payloadForm, finalizeIntake: true })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(String(payload.error || "Could not save draft"));
      return;
    }
    const pdfLink = String(payload?.intakePdf?.driveLink || "");
    const pdfError = String(payload?.intakePdfError || "");
    if (pdfLink) {
      setStatus(`Saved successfully. Intake PDF uploaded: ${pdfLink}`);
    } else if (pdfError) {
      setStatus(`Saved successfully (Drive upload pending): ${pdfError}`);
    } else {
      setStatus("Saved successfully.");
    }
  }

  async function sendAssistantMessage(event: FormEvent) {
    event.preventDefault();
    const text = assistantInput.trim();
    if (!text) return;
    setAssistantStatus("Sending...");
    const res = await fetch(`/api/cases/${params.caseId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode: "ai" })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAssistantStatus(String(payload.error || "Could not send message"));
      return;
    }
    setAssistantInput("");
    setAssistantStatus("Assistant replied.");
    await loadAssistantMessages();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <section className="rounded-2xl border-2 border-slate-300 bg-white p-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Simple Client Intake</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Case {params.caseId}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Keep answers simple. Upload your passport and permits in Documents; Newton team will fill technical form details from those documents.
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowAssistant((prev) => !prev)}
            className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {showAssistant ? "Hide Assistant" : "Talk to Assistant"}
          </button>
        </div>
        {showAssistant ? (
          <section className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">AI Assistant</p>
            <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded border border-slate-200 bg-white p-2 text-xs">
              {assistantMessages.map((m) => (
                <div key={m.id} className="rounded border border-slate-100 p-2">
                  <p className="font-semibold text-slate-600">{m.senderType === "ai" ? "Assistant" : m.senderName}</p>
                  <p className="mt-1 whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
              {assistantMessages.length === 0 ? <p className="text-slate-500">No messages yet.</p> : null}
            </div>
            <form onSubmit={sendAssistantMessage} className="mt-2 flex gap-2">
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                className="flex-1 rounded border border-slate-300 px-2 py-2 text-xs"
                placeholder="Ask for help filling this form..."
              />
              <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                Send
              </button>
            </form>
            {assistantStatus ? <p className="mt-1 text-xs text-slate-600">{assistantStatus}</p> : null}
          </section>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        ) : (
          <form className="mt-5 grid gap-3" onSubmit={saveDraft}>
            <SectionTitle title="Basic Details" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Application Type
                <input
                  value={form.applicationType}
                  readOnly
                  className="mt-1 w-full rounded-lg border-2 border-slate-300 bg-slate-100 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">Full Name
                <input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Used any other name?
                <input value={form.usedOtherName} onChange={(e) => updateField("usedOtherName", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" placeholder="Yes/No" />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Other name details (if yes)
                <input value={form.otherNameDetails} onChange={(e) => updateField("otherNameDetails", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Marital Status
                <input value={form.maritalStatus} onChange={(e) => updateField("maritalStatus", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Partner name (if married/common-law)
                <input value={form.spouseName} onChange={(e) => updateField("spouseName", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Date of marriage/common-law
                <input type="date" value={form.spouseDateOfMarriage} onChange={(e) => updateField("spouseDateOfMarriage", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Any previous marriage/common-law?
                <input value={form.previousMarriageCommonLaw} onChange={(e) => updateField("previousMarriageCommonLaw", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" placeholder="Yes/No" />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Previous relationship details (if yes)
                <textarea value={form.previousRelationshipDetails} onChange={(e) => updateField("previousRelationshipDetails", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={2} />
              </label>
            </div>

            <SectionTitle title="Application-Specific Questions" />
            <div className="grid gap-3">
              {appPrompts.map((prompt) => (
                <label key={prompt} className="text-sm font-medium text-slate-700">
                  {prompt}
                  <textarea
                    value={specificAnswers[prompt] || ""}
                    onChange={(e) => updateSpecificAnswer(prompt, e.target.value)}
                    className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2"
                    rows={2}
                  />
                </label>
              ))}
            </div>

            <SectionTitle title="Contact" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Phone
                <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Current and mailing address
                <input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Residential address (if different)
                <input value={form.residentialAddress} onChange={(e) => updateField("residentialAddress", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Any travel history for more than 6 months
                <input value={form.travelHistorySixMonths} onChange={(e) => updateField("travelHistorySixMonths", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" placeholder="Yes/No + details" />
              </label>
              {String(form.travelHistorySixMonths || "").toLowerCase().startsWith("y") ? (
                <div className="md:col-span-2 text-sm font-medium text-slate-700">
                  Travel history details
                  <div className="mt-1 space-y-2">
                    {travelEntries.map((entry, idx) => (
                      <div key={`travel-${idx}`} className="rounded-lg border border-slate-200 p-2">
                        <div className="grid gap-2 md:grid-cols-5">
                          <input
                            value={entry.country}
                            onChange={(e) => updateTravelEntry(idx, "country", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-2 text-xs"
                            placeholder="Country/Territory"
                          />
                          <input
                            value={entry.status}
                            onChange={(e) => updateTravelEntry(idx, "status", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-2 text-xs"
                            placeholder="Status"
                          />
                          <input
                            value={entry.from}
                            onChange={(e) => updateTravelEntry(idx, "from", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-2 text-xs"
                            placeholder="From (YYYY-MM)"
                          />
                          <input
                            value={entry.to}
                            onChange={(e) => updateTravelEntry(idx, "to", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-2 text-xs"
                            placeholder="To (YYYY-MM)"
                          />
                          <input
                            value={entry.details}
                            onChange={(e) => updateTravelEntry(idx, "details", e.target.value)}
                            className="rounded border border-slate-300 px-2 py-2 text-xs"
                            placeholder="Other details"
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeTravelRow(idx)}
                            className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addTravelRow}
                    className="mt-2 rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    + Add Travel Row
                  </button>
                </div>
              ) : null}
            </div>

            <SectionTitle title="Entry and Work" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Original Entry to Canada
                <input type="date" value={form.originalEntryDate} onChange={(e) => updateField("originalEntryDate", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Any recent entry (date/details)
                <input value={form.recentEntryDetails} onChange={(e) => updateField("recentEntryDetails", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
            </div>
            <label className="text-sm font-medium text-slate-700">Place of Entry and Purpose
              <textarea value={form.originalEntryPlacePurpose} onChange={(e) => updateField("originalEntryPlacePurpose", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={2} />
            </label>
            <div className="text-sm font-medium text-slate-700">
              Employment History (Please add your previous foreign experience as well)
              <div className="mt-1 space-y-2">
                {employmentEntries.map((entry, idx) => (
                  <div key={`emp-${idx}`} className="rounded-lg border border-slate-200 p-2">
                    <div className="grid gap-2 md:grid-cols-5">
                      <input
                        value={entry.from}
                        onChange={(e) => updateEmploymentEntry(idx, "from", e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="From (YYYY-MM)"
                      />
                      <input
                        value={entry.to}
                        onChange={(e) => updateEmploymentEntry(idx, "to", e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="To (YYYY-MM)"
                      />
                      <input
                        value={entry.position}
                        onChange={(e) => updateEmploymentEntry(idx, "position", e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="Position"
                      />
                      <input
                        value={entry.employer}
                        onChange={(e) => updateEmploymentEntry(idx, "employer", e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="Employer"
                      />
                      <input
                        value={entry.location}
                        onChange={(e) => updateEmploymentEntry(idx, "location", e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="Location"
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeEmploymentRow(idx)}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmploymentRow}
                className="mt-2 rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                + Add Employment Row
              </button>
            </div>

            <SectionTitle title="Background Questions" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Native Language
                <input value={form.nativeLanguage} onChange={(e) => updateField("nativeLanguage", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">Highest Education
                <select value={form.education} onChange={(e) => updateField("education", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2">
                  <option value="">Select education</option>
                  <option value="12th">12th</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">Taken English test?
                <input value={form.englishTestTaken} onChange={(e) => updateField("englishTestTaken", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" placeholder="Yes/No" />
              </label>
            </div>
            {["bachelor", "master", "other"].includes(String(form.education || "").toLowerCase()) ? (
              <div className="text-sm font-medium text-slate-700">
                Education details (more than diploma)
                <div className="mt-1 space-y-2">
                  {educationEntries.map((entry, idx) => (
                    <div key={`edu-${idx}`} className="rounded-lg border border-slate-200 p-2">
                      <div className="grid gap-2 md:grid-cols-5">
                        <input
                          value={entry.from}
                          onChange={(e) => updateEducationEntry(idx, "from", e.target.value)}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="From (YYYY-MM)"
                        />
                        <input
                          value={entry.to}
                          onChange={(e) => updateEducationEntry(idx, "to", e.target.value)}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="To (YYYY-MM)"
                        />
                        <input
                          value={entry.fieldOfStudy}
                          onChange={(e) => updateEducationEntry(idx, "fieldOfStudy", e.target.value)}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="Field of Study"
                        />
                        <input
                          value={entry.institute}
                          onChange={(e) => updateEducationEntry(idx, "institute", e.target.value)}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="Institute"
                        />
                        <input
                          value={entry.city}
                          onChange={(e) => updateEducationEntry(idx, "city", e.target.value)}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="City"
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeEducationRow(idx)}
                          className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addEducationRow}
                  className="mt-2 rounded border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  + Add Education Row
                </button>
              </div>
            ) : null}
            <label className="text-sm font-medium text-slate-700">IELTS / Language Test (optional)
              <textarea value={form.ieltsDetails} onChange={(e) => updateField("ieltsDetails", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={2} />
            </label>
            <label className="text-sm font-medium text-slate-700">Any refusal by any country?
              <input value={form.refusedAnyCountry} onChange={(e) => updateField("refusedAnyCountry", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" placeholder="Yes/No" />
            </label>
            <label className="text-sm font-medium text-slate-700">Refusal details (if yes)
              <textarea value={form.refusalDetails} onChange={(e) => updateField("refusalDetails", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={2} />
            </label>
            <label className="text-sm font-medium text-slate-700">Any criminal history?
              <textarea value={form.criminalHistory} onChange={(e) => updateField("criminalHistory", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={2} />
            </label>
            <label className="text-sm font-medium text-slate-700">Any medical history?
              <textarea value={form.medicalHistory} onChange={(e) => updateField("medicalHistory", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={2} />
            </label>
            <label className="text-sm font-medium text-slate-700">Anything else we should know?
              <textarea value={form.additionalNotes} onChange={(e) => updateField("additionalNotes", e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" rows={3} />
            </label>

            <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
              Team Note: Passport details, permit details, status dates, and technical IMM5710 fields will be extracted by Newton team from uploaded documents.
            </div>

            <div className="mt-1 flex flex-wrap gap-2">
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Save Draft
              </button>
              <Link href="/" className="rounded-lg border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Back to Dashboard
              </Link>
            </div>
            {status ? <p className="text-xs text-slate-600">{status}</p> : null}
          </form>
        )}
      </section>
    </main>
  );
}
