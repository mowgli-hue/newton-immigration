"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  Users
} from "lucide-react";
import { Header } from "@/components/header";
import { LoginView } from "@/components/login-view";
import { CaseItem, Role } from "@/lib/data";
import { apiFetch } from "@/lib/api-client";
import { Company } from "@/lib/models";
import { getChecklistForFormType } from "@/lib/application-checklists";

type Screen = "dashboard" | "cases" | "communications" | "accounting" | "tasks" | "chat" | "files";
type ClientScreen = "retainer" | "payment" | "overview" | "documents" | "questions" | "chat";
type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  userType: "staff" | "client";
};

type MessageItem = {
  id: string;
  senderName: string;
  senderType: "staff" | "client" | "ai";
  text: string;
  createdAt: string;
};

type DocumentItem = {
  id: string;
  name: string;
  status: "pending" | "received";
  link: string;
  createdAt: string;
};

type TaskItem = {
  id: string;
  caseId: string;
  title: string;
  description: string;
  assignedTo: string;
  createdBy: "ai" | "admin";
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  dueDate?: string;
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: "deadline" | "missing_doc" | "ai_alert";
  message: string;
  read: boolean;
  createdAt: string;
};
type DocRequestItem = {
  id: string;
  title: string;
  details?: string;
  status: "open" | "fulfilled";
  requestedBy: string;
  requestedAt: string;
  fulfilledAt?: string;
  fulfilledBy?: string;
  documentId?: string;
};
type CaseDetailTab = "overview" | "documents" | "tasks" | "communication";
type CaseBoardView = "home" | "new_cases" | "under_review_cases" | "urgent_cases" | "all_cases";

type PgwpDraft = {
  applicationType: "PGWP";
  requiredDocuments: Array<{ key: string; label: string; required: boolean; matchedDocumentName?: string; received: boolean }>;
  missingDocuments: string[];
  missingOptionalDocuments?: string[];
  riskFlags: string[];
  reviewChecklist: string[];
  finalSubmissionOrder?: string[];
  recommendedFileNames?: string[];
  representativeLetterDraft: string;
};

type RequiredDocItem = {
  key: string;
  label: string;
  required?: boolean;
  keywords?: string[];
};

const APPLICATION_TYPES: string[] = [
  "PGWP",
  "Post-Graduation Work Permit (PGWP)",
  "Visitor Visa (TRV - Outside Canada)",
  "TRV (Inside Canada)",
  "Visitor Record (Extension)",
  "Super Visa",
  "Study Permit (Outside Canada)",
  "Study Permit Extension (Inside Canada)",
  "College Change",
  "LMIA-Based Work Permit",
  "LMIA-Exempt Work Permit (C11, Francophone, etc.)",
  "Spousal Open Work Permit (SOWP)",
  "SOWP Extension",
  "Open Work Permit (General)",
  "Bridging Open Work Permit (BOWP)",
  "Vulnerable Open Work Permit",
  "Restoration (Work/Study/Visitor)",
  "Temporary Resident Permit (TRP)",
  "Verification of Status",
  "Travel Document (PRTD)",
  "Express Entry Profile Creation",
  "Express Entry PR Application",
  "BC PNP",
  "Alberta PNP (AAIP)",
  "Other Provinces PNP",
  "Spousal Sponsorship (Inside Canada)",
  "Spousal Sponsorship (Outside Canada)",
  "Parents & Grandparents Sponsorship",
  "Home Care Worker Pilot",
  "PR Pathways via LMIA / Work Experience",
  "Refugee Claim",
  "Humanitarian & Compassionate (H&C)",
  "Citizenship Application",
  "PR Card Renewal",
  "PR Card Replacement",
  "B1/B2 Visitor Visa (DS-160)",
  "UK Visitor Visa",
  "C11 Owner-Operator Work Permit",
  "Entrepreneur Programs (BC PNP / AAIP Rural)",
  "LMIA Application",
  "Job Bank / Employer Portal Setup",
  "Offer of Employment (LMIA-exempt)",
  "WES Evaluation",
  "ATIP Notes",
  "Passport Renewal",
  "E-Visa (Generic)",
  "Express Entry + PNP",
  "PNP + PR",
  "LMIA + Work Permit",
  "PR Sponsorship + Open Work Permit",
  "Study Permit + SOWP",
  "IMM5710"
];

type InternalExtractionIntake = {
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  countryOfBirth?: string;
  citizenship?: string;
  currentCountryStatus?: string;
  studyPermitExpiryDate?: string;
  permitDetails?: string;
};

const tabs: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "cases", label: "Cases", icon: <Users size={16} /> },
  { id: "communications", label: "Communications", icon: <MessageCircle size={16} /> },
  { id: "accounting", label: "Accounting", icon: <FileText size={16} /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare size={16} /> },
  { id: "chat", label: "Chat", icon: <MessageCircle size={16} /> },
  { id: "files", label: "Files", icon: <FileText size={16} /> }
];

function filterCasesByRole(allCases: CaseItem[], role: Role) {
  if (role === "Reviewer") return allCases.filter((c) => c.stage === "Under Review" || c.reviewer !== "N/A");
  if (role === "Owner") return allCases.filter((c) => c.owner !== "N/A");
  return allCases;
}

function questionnaireUrl(link: string | undefined, caseId: string) {
  const clean = (link ?? "").trim();
  if (!clean) return `/questionnaire/${caseId}`;
  if (clean.includes("newton.local")) return `/questionnaire/${caseId}`;
  return clean;
}

type SimpleShellProps = {
  expectedSlug?: string;
};

export function SimpleShell({ expectedSlug }: SimpleShellProps) {
  const fixedInteracRecipient =
    process.env.NEXT_PUBLIC_INTERAC_RECIPIENT || "payments@newtonimmigration.ca";
  const normalizeInteracInstructions = (value?: string) =>
    (value || "Use your case number in message and upload proof.")
      .replace(/payments@newtonimmigration\.com/gi, fixedInteracRecipient)
      .replace(/payments@newtonimmigration\.ca/gi, fixedInteracRecipient);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [caseBoardView, setCaseBoardView] = useState<CaseBoardView>("home");
  const [clientScreen, setClientScreen] = useState<ClientScreen>("retainer");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [viewRole, setViewRole] = useState<Role>("Admin");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docRequests, setDocRequests] = useState<DocRequestItem[]>([]);
  const [clientIntakeDone, setClientIntakeDone] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [caseDetailTab, setCaseDetailTab] = useState<CaseDetailTab>("overview");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskActionStatus, setTaskActionStatus] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [retainerName, setRetainerName] = useState("");
  const [retainerSignatureType, setRetainerSignatureType] = useState<"initials" | "signature" | "typed">("typed");
  const [retainerSignatureValue, setRetainerSignatureValue] = useState("");
  const [retainerAccepted, setRetainerAccepted] = useState(false);
  const [retainerStatus, setRetainerStatus] = useState("");
  const [commClientName, setCommClientName] = useState("");
  const [commFormType, setCommFormType] = useState("IMM5710");
  const [commPhone, setCommPhone] = useState("");
  const [commCreateStatus, setCommCreateStatus] = useState("");
  const [commUrgent, setCommUrgent] = useState(false);
  const [commUrgentDays, setCommUrgentDays] = useState("5");
  const [commSearch, setCommSearch] = useState("");
  const [commPaymentStatus, setCommPaymentStatus] = useState("");
  const [commPruneCaseIds, setCommPruneCaseIds] = useState("CASE-1006, CASE-1007");
  const [commPruneStatus, setCommPruneStatus] = useState("");
  const [caseSearch, setCaseSearch] = useState("");
  const [accountingSearch, setAccountingSearch] = useState("");
  const [accountingAmount, setAccountingAmount] = useState<Record<string, string>>({});
  const [accountingStatus, setAccountingStatus] = useState("");
  const [brandAppName, setBrandAppName] = useState("");
  const [brandLogoText, setBrandLogoText] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandDriveRootLink, setBrandDriveRootLink] = useState("");
  const [brandStatus, setBrandStatus] = useState("");
  const [setupFormType, setSetupFormType] = useState("");
  const [setupRetainerAmount, setSetupRetainerAmount] = useState("");
  const [setupInteracRecipient, setSetupInteracRecipient] = useState("");
  const [setupInteracInstructions, setSetupInteracInstructions] = useState("");
  const [retainerConfirm, setRetainerConfirm] = useState(false);
  const [setupStatus, setSetupStatus] = useState("");
  const [paymentEmailTemplate, setPaymentEmailTemplate] = useState("");
  const [paymentEmailStatus, setPaymentEmailStatus] = useState("");
  const [clientMessageTemplate, setClientMessageTemplate] = useState("");
  const [clientMessageStatus, setClientMessageStatus] = useState("");
  const [aiDraft, setAiDraft] = useState<PgwpDraft | null>(null);
  const [aiDraftStatus, setAiDraftStatus] = useState("");
  const [readyPackageStatus, setReadyPackageStatus] = useState("");
  const [readyPackagePath, setReadyPackagePath] = useState("");
  const [immRunStatus, setImmRunStatus] = useState("");
  const [clientUploadFile, setClientUploadFile] = useState<File | null>(null);
  const [clientUploadStatus, setClientUploadStatus] = useState("");
  const [requestedUploadFiles, setRequestedUploadFiles] = useState<Record<string, File | null>>({});
  const [requestedUploadStatus, setRequestedUploadStatus] = useState<Record<string, string>>({});
  const [staffDocRequestTitle, setStaffDocRequestTitle] = useState("");
  const [staffDocRequestDetails, setStaffDocRequestDetails] = useState("");
  const [staffDocRequestStatus, setStaffDocRequestStatus] = useState("");
  const [clientProfileOpen, setClientProfileOpen] = useState(false);
  const [clientWorkOpen, setClientWorkOpen] = useState(false);
  const [interacCopyStatus, setInteracCopyStatus] = useState("");
  const [checklistFiles, setChecklistFiles] = useState<Record<string, File | null>>({});
  const [checklistStatus, setChecklistStatus] = useState<Record<string, string>>({});
  const [internalIntake, setInternalIntake] = useState<InternalExtractionIntake>({});
  const [internalIntakeStatus, setInternalIntakeStatus] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [paymentLinkStatus, setPaymentLinkStatus] = useState("");
  const [leadSheetCsvUrl, setLeadSheetCsvUrl] = useState(
    process.env.NEXT_PUBLIC_LEADS_SHEET_CSV_URL || ""
  );
  const [leadSyncStatus, setLeadSyncStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLocalRuntime, setIsLocalRuntime] = useState(true);

  async function loadSession() {
    setLoading(true);
    setError("");
    try {
      const meRes = await apiFetch("/auth/me", { cache: "no-store" });
      if (!meRes.ok) {
        setSessionUser(null);
        setCompany(null);
        setCases([]);
        return;
      }
      const me = await meRes.json();
      const user = me.user as SessionUser;
      const comp = me.company as Company;
      setSessionUser(user);
      setCompany(comp);
      setViewRole(user.role);
      setBrandAppName(comp?.branding?.appName || "");
      setBrandLogoText(comp?.branding?.logoText || "");
      setBrandLogoUrl(comp?.branding?.logoUrl || "");
      setBrandDriveRootLink(comp?.branding?.driveRootLink || "");

      const caseRes = await apiFetch("/cases", { cache: "no-store" });
      if (!caseRes.ok) {
        setError("Could not load cases");
        return;
      }
      const casePayload = await caseRes.json();
      const loadedCases = casePayload.cases as CaseItem[];
      setCases(loadedCases);
      if (loadedCases.length > 0) setSelectedCaseId((prev) => prev || loadedCases[0].id);

      const [taskRes, noticeRes] = await Promise.all([
        apiFetch("/tasks", { cache: "no-store" }),
        apiFetch("/notifications", { cache: "no-store" })
      ]);
      if (taskRes.ok) {
        const t = await taskRes.json();
        setTasks((t.tasks || []) as TaskItem[]);
      }
      if (noticeRes.ok) {
        const n = await noticeRes.json();
        setNotifications((n.notifications || []) as NotificationItem[]);
      }
    } catch {
      setError("Could not load workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname.toLowerCase();
    const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
    setIsLocalRuntime(localHosts.has(host));
  }, []);

  const visibleCases = useMemo(() => {
    const byRole = filterCasesByRole(cases, viewRole);
    const q = caseSearch.trim().toLowerCase();
    if (!q) return byRole;
    return byRole.filter((c) => {
      const candidate = `${c.id} ${c.client} ${c.formType}`.toLowerCase();
      return candidate.includes(q);
    });
  }, [cases, viewRole, caseSearch]);
  const selectedCase = visibleCases.find((c) => c.id === selectedCaseId) ?? visibleCases[0] ?? null;
  const newCasesList = useMemo(
    () => visibleCases.filter((c) => (c.caseStatus || "lead") === "lead"),
    [visibleCases]
  );
  const underReviewCasesList = useMemo(
    () =>
      visibleCases.filter(
        (c) =>
          (c.caseStatus || "lead") === "under_review" ||
          c.stage === "Under Review" ||
          (c.aiStatus || "idle") === "drafting"
      ),
    [visibleCases]
  );
  const activeCaseBoardList = useMemo(() => {
    if (caseBoardView === "new_cases") return newCasesList;
    if (caseBoardView === "under_review_cases") return underReviewCasesList;
    if (caseBoardView === "urgent_cases") return visibleCases.filter((c) => Boolean(c.isUrgent));
    return visibleCases;
  }, [caseBoardView, newCasesList, underReviewCasesList, visibleCases]);
  const caseTasks = useMemo(
    () => (selectedCase ? tasks.filter((t) => t.caseId === selectedCase.id) : []),
    [tasks, selectedCase?.id]
  );
  const communicationSearchList = useMemo(() => {
    const query = commSearch.trim().toLowerCase();
    if (!query) return visibleCases.slice(0, 8);
    return visibleCases
      .filter((c) => {
        const client = c.client.toLowerCase();
        const formType = (c.formType || "").toLowerCase();
        const caseId = c.id.toLowerCase();
        return client.includes(query) || formType.includes(query) || caseId.includes(query);
      })
      .slice(0, 8);
  }, [commSearch, visibleCases]);

  async function loadCaseDetail(caseId: string) {
    const [msgRes, docRes, reqRes] = await Promise.all([
      apiFetch(`/cases/${caseId}/messages`, { cache: "no-store" }),
      apiFetch(`/cases/${caseId}/documents`, { cache: "no-store" }),
      apiFetch(`/cases/${caseId}/doc-requests`, { cache: "no-store" })
    ]);

    if (msgRes.ok) {
      const payload = await msgRes.json();
      setMessages(payload.messages as MessageItem[]);
    }
    if (docRes.ok) {
      const payload = await docRes.json();
      setDocuments(payload.documents as DocumentItem[]);
    }
    if (reqRes.ok) {
      const payload = await reqRes.json();
      setDocRequests((payload.requests || []) as DocRequestItem[]);
    }
  }

  async function loadClientIntakeProgress(caseId: string) {
    const res = await apiFetch(`/cases/${caseId}/intake`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setClientIntakeDone(false);
      return;
    }
    const intake = (payload.intake || {}) as Record<string, string>;
    const required = [
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
    const allBase = required.every((k) => String(intake[k] || "").trim().length > 0);
    const usedOther = String(intake.usedOtherName || "").toLowerCase();
    const needsOtherNameDetails = usedOther.startsWith("y");
    const otherNameOk = !needsOtherNameDetails || String(intake.otherNameDetails || "").trim().length > 0;

    const marital = String(intake.maritalStatus || "").toLowerCase();
    const needsSpouse = marital.includes("married") || marital.includes("common");
    const spouseOk =
      !needsSpouse ||
      (String(intake.spouseName || "").trim().length > 0 &&
        String(intake.spouseDateOfMarriage || "").trim().length > 0);

    const previousMarriage = String(intake.previousMarriageCommonLaw || "").toLowerCase();
    const needsPrevDetails = previousMarriage.startsWith("y");
    const prevOk = !needsPrevDetails || String(intake.previousRelationshipDetails || "").trim().length > 0;

    const refusal = String(intake.refusedAnyCountry || "").toLowerCase();
    const needsRefusalDetails = refusal.startsWith("y");
    const refusalOk = !needsRefusalDetails || String(intake.refusalDetails || "").trim().length > 0;

    const travel = String(intake.travelHistorySixMonths || "").toLowerCase();
    const needsTravelDetails = travel.startsWith("y");
    const travelOk = !needsTravelDetails || String(intake.travelHistoryDetails || "").trim().length > 0;

    const education = String(intake.education || "").toLowerCase();
    const needsEducationDetails = ["bachelor", "master", "other"].includes(education);
    const educationOk = !needsEducationDetails || String(intake.educationDetails || "").trim().length > 0;

    const done = allBase && otherNameOk && spouseOk && prevOk && refusalOk && travelOk && educationOk;
    setClientIntakeDone(done);
  }

  async function refreshTasks(caseId?: string) {
    const url = caseId ? `/tasks?caseId=${encodeURIComponent(caseId)}` : "/tasks";
    const res = await apiFetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const payload = await res.json().catch(() => ({}));
    setTasks((payload.tasks || []) as TaskItem[]);
  }

  async function loadInternalIntake(caseId: string) {
    const res = await apiFetch(`/cases/${caseId}/intake`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInternalIntake({});
      setInternalIntakeStatus(String(payload.error || "Could not load internal extraction fields"));
      return;
    }
    setInternalIntake((payload.intake || {}) as InternalExtractionIntake);
    setInternalIntakeStatus("");
  }

  async function loadLatestInviteForCase(caseId: string) {
    const res = await apiFetch(`/cases/${caseId}/invite`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setInviteUrl(String(payload.inviteUrl || ""));
  }

  useEffect(() => {
    if (!selectedCase) return;
    void loadCaseDetail(selectedCase.id);
    void loadInternalIntake(selectedCase.id);
    void refreshTasks(selectedCase.id);
    setCaseDetailTab("overview");
    setTaskActionStatus("");
  }, [selectedCase?.id]);

  useEffect(() => {
    if (!selectedCase || sessionUser?.userType !== "client") return;
    void loadClientIntakeProgress(selectedCase.id);
  }, [selectedCase?.id, sessionUser?.userType]);

  useEffect(() => {
    setInviteStatus("");
    if (!selectedCase || sessionUser?.userType !== "staff") {
      setInviteUrl("");
      return;
    }
    void loadLatestInviteForCase(selectedCase.id);
  }, [selectedCase?.id, sessionUser?.userType]);

  useEffect(() => {
    if (!selectedCase) return;
    setSetupFormType(selectedCase.formType || "");
    setSetupRetainerAmount(String(selectedCase.servicePackage.retainerAmount ?? ""));
    setSetupInteracRecipient(fixedInteracRecipient);
    setSetupInteracInstructions(selectedCase.interacInstructions || "");
    setRetainerConfirm(false);
    setSetupStatus("");
    setPaymentEmailTemplate("");
    setPaymentEmailStatus("");
    setClientMessageTemplate("");
    setClientMessageStatus("");
    setAiDraft(null);
    setAiDraftStatus("");
    setReadyPackageStatus("");
    setReadyPackagePath("");
    setImmRunStatus("");
    setInternalIntake({});
    setInternalIntakeStatus("");
  }, [selectedCase?.id]);

  useEffect(() => {
    if (sessionUser?.userType === "client" && sessionUser.name) {
      setRetainerName((prev) => prev || sessionUser.name);
    }
  }, [sessionUser?.userType, sessionUser?.name]);

  useEffect(() => {
    if (sessionUser?.userType !== "client") return;
    const clientCase = cases[0];
    if (!clientCase) return;
    if (!clientCase.retainerSigned) return;
    if (clientCase.paymentStatus !== "paid" && clientCase.paymentStatus !== "not_required") return;

    // Auto-guide the client to the next required step after payment confirmation.
    if (!clientIntakeDone) {
      setClientScreen("questions");
      return;
    }
    setClientScreen("documents");
  }, [sessionUser?.userType, cases, clientIntakeDone]);

  useEffect(() => {
    if (!selectedCase) return;
    if (screen !== "chat" && sessionUser?.userType !== "client") return;
    const timer = setInterval(() => {
      void loadCaseDetail(selectedCase.id);
    }, 4000);
    return () => clearInterval(timer);
  }, [screen, selectedCase?.id, sessionUser?.userType]);

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setSessionUser(null);
    setCompany(null);
    setCases([]);
  }

  async function createCaseFromCommunications() {
    if (!commClientName.trim() || !commFormType.trim()) {
      setCommCreateStatus("Client name and application type are required.");
      return;
    }
    if (commUrgent) {
      const days = Number(commUrgentDays || 0);
      if (!Number.isFinite(days) || days <= 0) {
        setCommCreateStatus("Enter valid urgent deadline days.");
        return;
      }
    }
    setCommCreateStatus("Creating case...");
    const res = await apiFetch("/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: commClientName.trim(),
        formType: commFormType.trim(),
        leadPhone: commPhone.trim() || undefined,
        isUrgent: commUrgent,
        dueInDays: commUrgent ? Number(commUrgentDays || 0) : undefined
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCommCreateStatus(String(payload.error || "Could not create case."));
      return;
    }
    const created = payload.case as CaseItem;
    setCases((prev) => [created, ...prev]);
    setSelectedCaseId(created.id);
    setSetupFormType(created.formType || commFormType.trim());
    setCommCreateStatus(`Case created: ${created.id}. Now create invite/payment link below.`);
    setCommClientName("");
    setCommPhone("");
    setCommUrgent(false);
    setCommUrgentDays("5");
  }

  async function pruneToRealCases() {
    if (sessionUser?.role !== "Admin" || sessionUser?.userType !== "staff") {
      setCommPruneStatus("Only Admin can run this action.");
      return;
    }
    const keepCaseIds = commPruneCaseIds
      .split(/[\n, ]+/g)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (keepCaseIds.length === 0) {
      setCommPruneStatus("Enter at least one case ID, e.g. CASE-1006.");
      return;
    }

    setCommPruneStatus("Pruning test cases...");
    const res = await apiFetch("/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pruneCases: true,
        confirmText: "PRUNE",
        keepCaseIds
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCommPruneStatus(String(payload.error || "Could not prune cases."));
      return;
    }
    const deletedCount = Number(payload.deletedCount || 0);
    setCommPruneStatus(`Done. Removed ${deletedCount} non-selected case(s).`);
    await loadSession();
  }

  async function sendMessage(mode: "human" | "ai") {
    const text = chatText.trim();
    if (!text) return;

    const targetCaseId = selectedCase?.id || cases[0]?.id;
    if (!targetCaseId) {
      setChatStatus("No case found for chat.");
      return;
    }

    setChatStatus("Sending...");
    const res = await apiFetch(`/cases/${targetCaseId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setChatStatus(String(payload.error || "Could not send message."));
      return;
    }
    setMessages((prev) => {
      const next = [...prev];
      if (payload.message) next.push(payload.message as MessageItem);
      if (payload.aiMessage) next.push(payload.aiMessage as MessageItem);
      return next;
    });
    setChatText("");
    setChatStatus("Sent.");
  }

  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCase) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const link = String(data.get("link") ?? "").trim();
    if (!name) return;

    const res = await apiFetch(`/cases/${selectedCase.id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, link, status: "pending" })
    });
    if (!res.ok) return;
    const payload = await res.json();
    setDocuments((prev) => [...prev, payload.document as DocumentItem]);
    form.reset();
  }

  async function syncLeadsFromSheet() {
    setLeadSyncStatus("Syncing leads...");
    const res = await apiFetch("/integrations/google-sheet/sync-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvUrl: leadSheetCsvUrl.trim() || undefined })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLeadSyncStatus(String(payload.error || "Could not sync lead sheet"));
      return;
    }
    setLeadSyncStatus(
      `Lead sync complete. Created ${Number(payload.created || 0)} case(s), skipped ${Number(payload.skipped || 0)}.`
    );
    await loadSession();
  }

  async function createClientInvite() {
    if (!selectedCase) return;
    setInviteStatus("Creating invite link...");
    const res = await apiFetch(`/cases/${selectedCase.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() || undefined })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteStatus(String(payload.error || "Could not create invite"));
      return;
    }
    const url = String(payload.inviteUrl || "");
    setInviteUrl(url);
    setInviteStatus("Invite link ready. Send this to client.");
  }

  async function sendPaymentLinkForCase(caseInput?: CaseItem) {
    const caseItem = caseInput ?? selectedCase;
    if (!caseItem) return;
    setPaymentLinkStatus("Preparing payment link...");

    const formTypeToUse = setupFormType.trim() || caseItem.formType;
    const amountRaw = Number(setupRetainerAmount || caseItem.servicePackage.retainerAmount || 0);
    const retainerAmountToUse = Number.isFinite(amountRaw) && amountRaw > 0
      ? amountRaw
      : caseItem.servicePackage.retainerAmount;
    const interacInstructionsToUse =
      setupInteracInstructions.trim() ||
      caseItem.interacInstructions ||
      "Please include your case number in transfer message and share payment screenshot.";

    const retainerRes = await apiFetch(`/cases/${caseItem.id}/retainer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formType: formTypeToUse,
        retainerAmount: retainerAmountToUse,
        paymentMethod: "interac",
        interacRecipient: fixedInteracRecipient,
        interacInstructions: interacInstructionsToUse,
        sendRetainer: true,
        paymentStatus: "pending"
      })
    });
    const retainerPayload = await retainerRes.json().catch(() => ({}));
    if (!retainerRes.ok) {
      setPaymentLinkStatus(String(retainerPayload.error || "Could not prepare retainer/payment settings."));
      return;
    }
    const updatedCase = retainerPayload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));

    const inviteRes = await apiFetch(`/cases/${caseItem.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() || undefined })
    });
    const invitePayload = await inviteRes.json().catch(() => ({}));
    if (!inviteRes.ok) {
      setPaymentLinkStatus(String(invitePayload.error || "Retainer prepared, but could not create invite link."));
      return;
    }

    const url = String(invitePayload.inviteUrl || "");
    setInviteUrl(url);
    setInviteStatus("Invite link generated.");

    let driveNote = "";
    const driveRes = await apiFetch(`/cases/${caseItem.id}/drive-folder`, { method: "POST" });
    const drivePayload = await driveRes.json().catch(() => ({}));
    if (!driveRes.ok) {
      driveNote = ` Drive folder not created: ${String(drivePayload.error || "unknown error")}`;
    } else if (drivePayload.case) {
      const next = drivePayload.case as CaseItem;
      setCases((prev) => prev.map((c) => (c.id === next.id ? next : c)));
    }

    setPaymentLinkStatus(`Payment link sent flow ready.${driveNote}`);
    await loadCaseDetail(caseItem.id);
    await refreshTasks(caseItem.id);
  }

  function getCaseNextAction(caseItem: CaseItem): {
    label: string;
    hint: string;
    type: "payment" | "documents" | "tasks" | "communication" | "open";
  } {
    if ((caseItem.paymentStatus || "pending") === "pending") {
      return { label: "Send Payment Link", hint: "Payment pending", type: "payment" };
    }
    if ((caseItem.aiStatus || "idle") === "waiting_client") {
      return { label: "Collect Missing Docs", hint: "Waiting on client", type: "documents" };
    }
    if ((caseItem.aiStatus || "idle") === "drafting" || (caseItem.caseStatus || "lead") === "under_review") {
      return { label: "Review Tasks", hint: "Under review flow", type: "tasks" };
    }
    if ((caseItem.caseStatus || "lead") === "ready") {
      return { label: "Open Communication", hint: "Ready for final update", type: "communication" };
    }
    return { label: "Open Case", hint: "Continue processing", type: "open" };
  }

  async function runCaseNextAction(caseItem: CaseItem) {
    setSelectedCaseId(caseItem.id);
    setScreen("cases");
    const action = getCaseNextAction(caseItem);

    if (action.type === "payment") {
      setCaseDetailTab("overview");
      await sendPaymentLinkForCase(caseItem);
      return;
    }
    if (action.type === "documents") {
      setCaseDetailTab("documents");
      await loadCaseDetail(caseItem.id);
      return;
    }
    if (action.type === "tasks") {
      setCaseDetailTab("tasks");
      await loadCaseDetail(caseItem.id);
      return;
    }
    if (action.type === "communication") {
      setCaseDetailTab("communication");
      await loadCaseDetail(caseItem.id);
      return;
    }

    setCaseDetailTab("overview");
    await loadCaseDetail(caseItem.id);
  }

  async function sendRetainerToClient() {
    if (!selectedCase) return;
    if (!retainerConfirm) {
      setSetupStatus("Please confirm application type and amount before sending.");
      return;
    }
    if (!setupFormType.trim() || !Number(setupRetainerAmount || 0)) {
      setSetupStatus("Application type and retainer amount are required.");
      return;
    }

    setSetupStatus("Sending retainer...");
    const res = await apiFetch(`/cases/${selectedCase.id}/retainer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formType: setupFormType.trim() || selectedCase.formType,
        retainerAmount: Number(setupRetainerAmount || 0),
        paymentMethod: "interac",
        interacRecipient: fixedInteracRecipient,
        interacInstructions: setupInteracInstructions.trim(),
        sendRetainer: true,
        paymentStatus: "pending"
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSetupStatus(String(payload.error || "Could not send retainer"));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    const inviteRes = await apiFetch(`/cases/${selectedCase.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim() || undefined })
    });
    const invitePayload = await inviteRes.json().catch(() => ({}));
    if (inviteRes.ok && invitePayload.inviteUrl) {
      const generatedInviteUrl = String(invitePayload.inviteUrl);
      setInviteUrl(generatedInviteUrl);
      setInviteStatus("Client link created.");
      setSetupStatus("Retainer + client link created. Send link to client.");
      const amount = Number(setupRetainerAmount || updated.servicePackage.retainerAmount || 0);
      const appType = setupFormType || updated.formType;
      const lines = [
        `Hi ${updated.client},`,
        "",
        `Newton Immigration has opened your file for ${appType}.`,
        `Case: ${updated.id}`,
        "",
        "Step 1: Complete retainer and create your portal account:",
        generatedInviteUrl,
        "",
        `Step 2: Send Interac payment of $${amount} CAD to ${fixedInteracRecipient}`,
        `Reference message: ${updated.id}`,
        setupInteracInstructions.trim() || "Please include your case number in transfer message.",
        "",
        "After payment, reply with confirmation screenshot.",
        "",
        "Newton Immigration Team"
      ];
      setClientMessageTemplate(lines.join("\n"));
      setClientMessageStatus("Client message template generated from this invite.");
      return;
    }
    setSetupStatus("Retainer sent, but client link generation failed.");
  }

  async function confirmInteracReceived() {
    if (!selectedCase) return;
    await confirmInteracReceivedForCase(selectedCase.id, "overview");
  }

  async function confirmInteracReceivedForCase(caseId: string, source: "overview" | "communications") {
    if (source === "communications") setCommPaymentStatus("Confirming payment...");
    else setSetupStatus("Confirming payment...");
    const res = await apiFetch(`/cases/${caseId}/retainer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = String(payload.error || "Could not confirm payment");
      if (source === "communications") setCommPaymentStatus(message);
      else setSetupStatus(message);
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (source === "communications") setCommPaymentStatus(`Payment confirmed for ${updated.id}.`);
    else setSetupStatus("Interac payment confirmed.");
  }

  async function recordAccountingPayment(caseId: string) {
    const amount = Number(accountingAmount[caseId] || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAccountingStatus("Enter a valid paid amount.");
      return;
    }
    setAccountingStatus("Recording payment...");
    const res = await apiFetch(`/cases/${caseId}/financials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record_payment", amount })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAccountingStatus(String(payload.error || "Could not record payment."));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setAccountingAmount((prev) => ({ ...prev, [caseId]: "" }));
    setAccountingStatus(`Payment recorded for ${updated.id}.`);
  }

  async function createDriveFolderForCase() {
    if (!selectedCase) return;
    setSetupStatus("Creating Drive case folder...");
    const res = await apiFetch(`/cases/${selectedCase.id}/drive-folder`, { method: "POST" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSetupStatus(String(payload.error || "Could not create Drive folder"));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSetupStatus("Drive case folder created and linked.");
  }

  async function saveBranding() {
    setBrandStatus("Saving branding...");
    const res = await apiFetch("/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: brandAppName.trim(),
        logoText: brandLogoText.trim(),
        logoUrl: brandLogoUrl.trim(),
        driveRootLink: brandDriveRootLink.trim()
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBrandStatus(String(payload.error || "Could not save branding"));
      return;
    }
    const nextCompany = payload.company as Company;
    setCompany(nextCompany);
    setBrandStatus("Branding updated.");
  }

  function buildInteracEmailTemplate() {
    if (!selectedCase || !company) return;
    const recipient = setupInteracRecipient.trim() || "your Interac autodeposit email";
    const amount = Number(setupRetainerAmount || selectedCase.servicePackage.retainerAmount || 0);
    const subject = `[${selectedCase.id}] Interac Payment Instructions - ${company.name}`;
    const body = [
      `Hi ${selectedCase.client},`,
      "",
      `Thank you for proceeding with your ${setupFormType || selectedCase.formType} application.`,
      "",
      `Please send your Interac e-Transfer payment of $${amount} CAD to: ${recipient}`,
      `Reference/Message: ${selectedCase.id}`,
      "",
      setupInteracInstructions.trim() || "Use your case number in the message and share payment confirmation.",
      "",
      `After payment, reply with confirmation so our team can update your file.`,
      "",
      `${company.name} Team`
    ].join("\n");
    setPaymentEmailTemplate(`Subject: ${subject}\n\n${body}`);
    setPaymentEmailStatus("Email template generated.");
  }

  async function copyPaymentEmailTemplate() {
    if (!paymentEmailTemplate.trim()) {
      setPaymentEmailStatus("Generate template first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(paymentEmailTemplate);
      setPaymentEmailStatus("Template copied.");
    } catch {
      setPaymentEmailStatus("Could not copy automatically. Select text and copy manually.");
    }
  }

  function buildClientInviteMessageTemplate() {
    if (!selectedCase || !company) return;
    const amount = Number(setupRetainerAmount || selectedCase.servicePackage.retainerAmount || 0);
    const appType = setupFormType || selectedCase.formType;
    const portalLink = inviteUrl || "(create invite link first)";
    const lines = [
      `Hi ${selectedCase.client},`,
      "",
      `Newton Immigration has opened your file for ${appType}.`,
      `Case: ${selectedCase.id}`,
      "",
      "Step 1: Complete retainer and create your portal account:",
      portalLink,
      "",
      `Step 2: Send Interac payment of $${amount} CAD to ${fixedInteracRecipient}`,
      `Reference message: ${selectedCase.id}`,
      setupInteracInstructions.trim() || "Please include your case number in transfer message.",
      "",
      "After payment, reply with confirmation screenshot.",
      "",
      "Newton Immigration Team"
    ];
    setClientMessageTemplate(lines.join("\n"));
    setClientMessageStatus("Client message template generated.");
  }

  async function copyClientMessageTemplate() {
    if (!clientMessageTemplate.trim()) {
      setClientMessageStatus("Generate template first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(clientMessageTemplate);
      setClientMessageStatus("Client message copied.");
    } catch {
      setClientMessageStatus("Could not copy automatically. Copy manually.");
    }
  }

  function downloadRetainer(caseItem: CaseItem, companyName: string) {
    const content = [
      `${companyName} - Service Agreement`,
      "",
      `Application Type: ${caseItem.formType}`,
      `Retainer Amount: $${caseItem.servicePackage.retainerAmount} CAD`,
      `Case ID: ${caseItem.id}`,
      "",
      "By signing, client confirms they have read and agreed to the retainer terms.",
      "",
      "Client Name: _______________________________",
      "Signature/Initials: _________________________",
      "Date: ______________________________________"
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${caseItem.id}_Retainer.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  async function generateAiDraftForCase() {
    if (!selectedCase) return;
    setAiDraftStatus("Generating AI draft...");
    const res = await apiFetch(`/cases/${selectedCase.id}/ai-draft`, { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiDraftStatus(String(payload.error || "Could not generate AI draft"));
      return;
    }
    setAiDraft(payload.draft as PgwpDraft);
    setAiDraftStatus("AI draft generated.");
  }

  async function generateReadyPackageForCase() {
    if (!selectedCase) return;
    setReadyPackageStatus("Generating ready package...");
    setReadyPackagePath("");
    const res = await apiFetch(`/cases/${selectedCase.id}/ready-package`, { method: "POST" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setReadyPackageStatus(String(payload.error || "Could not generate ready package"));
      return;
    }
    setReadyPackageStatus("Ready package generated.");
    setReadyPackagePath(String(payload.filePath || ""));
  }

  async function runImm5710AutomationForCase() {
    if (!selectedCase) return;
    setImmRunStatus("Preparing ready package...");
    const prepRes = await apiFetch(`/cases/${selectedCase.id}/ready-package`, { method: "POST" });
    const prepPayload = await prepRes.json().catch(() => ({}));
    if (!prepRes.ok) {
      setImmRunStatus(String(prepPayload.error || "Could not prepare ready package"));
      return;
    }
    const filePath = String(prepPayload.filePath || "");
    setReadyPackagePath(filePath);
    setReadyPackageStatus("Ready package generated.");

    setImmRunStatus("Starting IMM5710 automation...");
    const runRes = await apiFetch(`/cases/${selectedCase.id}/run-imm5710`, { method: "POST" });
    const runPayload = await runRes.json().catch(() => ({}));
    if (!runRes.ok) {
      setImmRunStatus(String(runPayload.error || "Could not start IMM5710 automation"));
      return;
    }
    setImmRunStatus(
      `IMM5710 automation started (PID ${String(runPayload.pid || "N/A")}). Check Acrobat and log: ${String(runPayload.logPath || "")}`
    );
  }

  function updateInternalIntakeField(field: keyof InternalExtractionIntake, value: string) {
    setInternalIntake((prev) => ({ ...prev, [field]: value }));
  }

  async function saveInternalExtraction() {
    if (!selectedCase) return;
    setInternalIntakeStatus("Saving extraction fields...");
    const res = await apiFetch(`/cases/${selectedCase.id}/intake`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(internalIntake)
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInternalIntakeStatus(String(payload.error || "Could not save extraction fields"));
      return;
    }
    setInternalIntakeStatus("Internal extraction fields saved.");
  }

  async function createCaseTask() {
    if (!selectedCase) return;
    if (!newTaskTitle.trim()) {
      setTaskActionStatus("Task title is required.");
      return;
    }
    setTaskActionStatus("Creating task...");
    const res = await apiFetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: selectedCase.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        priority: newTaskPriority
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTaskActionStatus(String(payload.error || "Could not create task"));
      return;
    }
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setTaskActionStatus("Task created.");
    await refreshTasks(selectedCase.id);
  }

  async function markTaskCompleted(taskId: string) {
    if (!selectedCase) return;
    const res = await apiFetch(`/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTaskActionStatus(String(payload.error || "Could not update task"));
      return;
    }
    setTaskActionStatus("Task marked completed.");
    await refreshTasks(selectedCase.id);
  }

  async function signRetainer(caseId: string) {
    if (!retainerName.trim() || !retainerSignatureValue.trim() || !retainerAccepted) {
      setRetainerStatus("Enter name, signature/initials, and accept terms.");
      return;
    }

    const res = await apiFetch(`/cases/${caseId}/retainer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signerName: retainerName.trim(),
        signatureType: retainerSignatureType,
        signatureValue: retainerSignatureValue.trim(),
        acceptedTerms: retainerAccepted
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRetainerStatus(String(payload.error || "Could not sign retainer"));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setRetainerStatus("Retainer signed successfully.");
    setClientScreen("payment");
  }

  async function uploadClientDocument(caseId: string) {
    if (!clientUploadFile) {
      setClientUploadStatus("Choose a file first.");
      return;
    }
    setClientUploadStatus("Uploading...");
    const data = new FormData();
    data.append("file", clientUploadFile);
    data.append("name", clientUploadFile.name);

    const res = await apiFetch(`/cases/${caseId}/documents`, {
      method: "POST",
      body: data
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setClientUploadStatus(String(payload.error || "Upload failed"));
      return;
    }
    setDocuments((prev) => [...prev, payload.document as DocumentItem]);
    setClientUploadFile(null);
    setClientUploadStatus("Upload complete.");
  }

  function isChecklistDocUploaded(item: RequiredDocItem): boolean {
    const names = documents.map((d) => d.name.toLowerCase());
    const keywords = (item.keywords && item.keywords.length > 0 ? item.keywords : [item.label]).map((k) =>
      String(k || "").toLowerCase()
    );
    return keywords.some((keyword) => names.some((n) => n.includes(keyword)));
  }

  async function uploadChecklistDocument(caseId: string, item: RequiredDocItem) {
    const file = checklistFiles[item.key];
    if (!file) {
      setChecklistStatus((prev) => ({ ...prev, [item.key]: "Choose a file first." }));
      return;
    }
    setChecklistStatus((prev) => ({ ...prev, [item.key]: "Uploading..." }));
    const data = new FormData();
    data.append("file", file);
    data.append("name", item.label);

    const res = await apiFetch(`/cases/${caseId}/documents`, {
      method: "POST",
      body: data
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setChecklistStatus((prev) => ({ ...prev, [item.key]: String(payload.error || "Upload failed") }));
      return;
    }
    setDocuments((prev) => [...prev, payload.document as DocumentItem]);
    setChecklistFiles((prev) => ({ ...prev, [item.key]: null }));
    setChecklistStatus((prev) => ({ ...prev, [item.key]: "Uploaded." }));
  }

  async function createStaffDocRequest() {
    if (!selectedCase) return;
    const title = staffDocRequestTitle.trim();
    const details = staffDocRequestDetails.trim();
    if (!title) {
      setStaffDocRequestStatus("Request title is required.");
      return;
    }
    setStaffDocRequestStatus("Sending request...");
    const res = await apiFetch(`/cases/${selectedCase.id}/doc-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, details })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStaffDocRequestStatus(String(payload.error || "Could not create doc request."));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setDocRequests((payload.requests || []) as DocRequestItem[]);
    setStaffDocRequestTitle("");
    setStaffDocRequestDetails("");
    setStaffDocRequestStatus("Request sent to client.");
  }

  async function uploadRequestedDocument(caseId: string, request: DocRequestItem) {
    const file = requestedUploadFiles[request.id];
    if (!file) {
      setRequestedUploadStatus((prev) => ({ ...prev, [request.id]: "Choose a file first." }));
      return;
    }
    setRequestedUploadStatus((prev) => ({ ...prev, [request.id]: "Uploading..." }));
    const data = new FormData();
    data.append("file", file);
    data.append("name", `Requested - ${request.title}`);
    data.append("requestId", request.id);

    const res = await apiFetch(`/cases/${caseId}/documents`, {
      method: "POST",
      body: data
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRequestedUploadStatus((prev) => ({ ...prev, [request.id]: String(payload.error || "Upload failed") }));
      return;
    }
    setDocuments((prev) => [...prev, payload.document as DocumentItem]);
    setRequestedUploadFiles((prev) => ({ ...prev, [request.id]: null }));
    setRequestedUploadStatus((prev) => ({ ...prev, [request.id]: "Uploaded." }));
    const reqRes = await apiFetch(`/cases/${caseId}/doc-requests`, { cache: "no-store" });
    if (reqRes.ok) {
      const reqPayload = await reqRes.json().catch(() => ({}));
      setDocRequests((reqPayload.requests || []) as DocRequestItem[]);
    }
  }

  async function copyInteracDetails(caseItem: CaseItem) {
    const amount = Number(caseItem.servicePackage.retainerAmount || 0);
    const text = [
      `Interac recipient: ${fixedInteracRecipient}`,
      `Amount: $${amount} CAD`,
      `Reference message: ${caseItem.id}`,
      normalizeInteracInstructions(caseItem.interacInstructions)
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setInteracCopyStatus("Payment details copied.");
    } catch {
      setInteracCopyStatus("Could not copy automatically. Please copy manually.");
    }
  }

  const caseCounts = useMemo(
    () => ({
      all: visibleCases.length,
      lead: visibleCases.filter((c) => (c.caseStatus || "lead") === "lead").length,
      active: visibleCases.filter((c) => (c.caseStatus || "lead") === "active").length,
      under_review: visibleCases.filter((c) => (c.caseStatus || "lead") === "under_review").length,
      ready: visibleCases.filter((c) => (c.caseStatus || "lead") === "ready").length,
      submitted: visibleCases.filter((c) => (c.caseStatus || "lead") === "submitted").length
    }),
    [visibleCases]
  );

  const headerProps = company
    ? {
        appName: company.branding.appName,
        logoText: company.branding.logoText,
        logoUrl: company.branding.logoUrl,
        subtitle: `${company.name} workflow: lead to decision in one simple workspace.`,
        primary: company.branding.primary,
        secondary: company.branding.secondary,
        success: company.branding.success,
        text: company.branding.background
      }
    : { subtitle: "Company workflow: lead to decision in one simple workspace." };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 py-8">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">
          <Loader2 size={16} className="animate-spin" /> Loading dashboard...
        </div>
      </main>
    );
  }

  if (!sessionUser) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <Header {...headerProps} />
        <LoginView onLoginSuccess={loadSession} />
      </main>
    );
  }

  if (expectedSlug && company && company.slug !== expectedSlug) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <Header {...headerProps} />
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900">
          You are signed into `{company.slug}`. Open `/portal/{company.slug}`.
        </section>
      </main>
    );
  }

  // Client portal view
  if (sessionUser.userType === "client") {
    const c = cases[0];
    const companyName = company?.name || "Your Company";
    const caseChecklist: RequiredDocItem[] = c ? getChecklistForFormType(c.formType) : [];
    const clientReadyForDocs = Boolean(
      c && c.retainerSigned && (c.paymentStatus === "paid" || c.paymentStatus === "not_required")
    );
    const docsChecklistComplete = (() => {
      if (!c) return false;
      const requiredItems = caseChecklist.filter((item) => item.required !== false);
      if (requiredItems.length === 0) return documents.length > 0;
      return requiredItems.every((item) => isChecklistDocUploaded(item));
    })();
    const openDocRequests = (docRequests || []).filter((r) => r.status === "open");
    const paymentSupportPhone = "6046535031";
    const processingSupportPhone = "6049024500";
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-6 md:py-8">
        <Header {...headerProps} />

        <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Client Portal</p>
              <h2 className="text-xl font-semibold text-slate-900">{sessionUser.name}</h2>
              <p className="text-xs text-slate-500">{company ? `/portal/${company.slug}` : ""}</p>
            </div>
          </div>
        </section>

        {c ? (
          <>
            <section className="rounded-2xl border-2 border-slate-500 bg-white p-3 shadow-sm">
              <div className="grid gap-2 sm:grid-cols-4">
                <button onClick={() => setClientScreen("overview")} className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${clientScreen !== "chat" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Tasks</button>
                <button onClick={() => setClientScreen("chat")} className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${clientScreen === "chat" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Chat</button>
              </div>
            </section>

            <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
              <button
                onClick={() => setClientProfileOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border-2 border-slate-700 bg-slate-50 px-3 py-2 text-left text-sm font-semibold"
              >
                <span>Profile</span>
                <span>{clientProfileOpen ? "Hide" : "Show"}</span>
              </button>
              {clientProfileOpen ? (
              <div className="mt-2 grid gap-2 md:grid-cols-4 text-sm">
                <article className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs text-slate-500">Case</p>
                  <p className="font-semibold">{c.id}</p>
                </article>
                <article className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs text-slate-500">Application</p>
                  <p className="font-semibold">{c.formType}</p>
                </article>
                <article className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs text-slate-500">Payment Status</p>
                  <p className="font-semibold">{c.paymentStatus || "pending"}</p>
                </article>
                <article className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs text-slate-500">Pending Fees</p>
                  <p className="font-semibold">
                    $
                    {c.paymentStatus === "paid"
                      ? Number(c.servicePackage.balanceAmount || 0)
                      : Number(c.servicePackage.retainerAmount || 0)}
                    {" "}CAD
                  </p>
                </article>
              </div>
              ) : null}
            </section>

            {clientScreen === "retainer" ? (
              <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                <button onClick={() => setClientScreen("overview")} className="mb-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold">Back to Tasks</button>
                <h3 className="font-semibold">Retainer Agreement</h3>
                <p className="mt-2 text-sm text-slate-700">{companyName} service starts after retainer e-sign.</p>
                <button
                  onClick={() => downloadRetainer(c, companyName)}
                  className="mt-2 rounded border border-slate-300 px-3 py-2 text-xs font-semibold"
                >
                  Download Retainer
                </button>
                {!c.retainerSentAt ? (
                  <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    Retainer has not been sent by team yet.
                  </div>
                ) : null}
                <div className="mt-3 max-h-72 overflow-auto rounded border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                  <p className="font-semibold">{companyName} - Service Agreement</p>
                  <p className="mt-2">This agreement describes the relationship between the client and {companyName}. By continuing and accepting this agreement, the client confirms that they understand the services being provided and agree to the terms described below.</p>
                  <p className="mt-2">{companyName} is an immigration consulting firm providing immigration consulting services to individuals seeking assistance with Canadian immigration matters. The authorized consultant providing services through the firm is Navdeep Singh Sandhu (RCIC), License Number R705964. The business office is located at 9850 King George Blvd, Unit 202A, Surrey, British Columbia, Canada.</p>
                  <p className="mt-2">The client is requesting immigration consulting services related to the following application type: <span className="font-semibold">{c.formType}</span>. The services provided may include reviewing the client&apos;s situation, providing guidance regarding immigration options, assisting with preparation of forms, advising on required documents, organizing application materials, and providing general support related to the immigration process.</p>
                  <p className="mt-2">The client understands that immigration applications require accurate information and supporting documents. The client agrees to provide truthful, complete, and accurate information during the process. The client also agrees to provide requested documents in a timely manner so that the application can be prepared correctly. If the client provides incorrect or incomplete information, it may affect the outcome of the application and {companyName} cannot be responsible for any refusal or delay resulting from incorrect information.</p>
                  <p className="mt-2">The total professional service fee for the requested services is <span className="font-semibold">${c.servicePackage.retainerAmount} CAD</span>. This fee covers the consulting services provided by {companyName} related to the application described above. Government processing fees, biometrics fees, medical examination costs, translation services, courier charges, or other third-party expenses are not included in the professional service fee unless specifically stated.</p>
                  <p className="mt-2">Refund Policy: Professional fees paid to {companyName} are generally non-refundable once work on the client&apos;s file has begun. In situations where services have not yet started, a partial refund may be considered after deducting any administrative or consultation costs. Government processing fees and third-party fees are non-refundable unless refunded by the respective authority.</p>
                  <p className="mt-2">The client understands that {companyName} provides professional consulting services but does not control the decisions made by immigration authorities. Final decisions regarding any immigration application are made solely by Immigration, Refugees and Citizenship Canada (IRCC) or other government authorities. Because of this, approval of any immigration application cannot be guaranteed.</p>
                  <p className="mt-2">To make the application process easier and more organized, the client may receive access to a secure {companyName} Client Portal. Through this portal the client may upload documents, review case updates, communicate with the case team, and receive instructions related to the application process. The client is responsible for reviewing notifications and messages sent through the portal and responding when additional information or documents are requested.</p>
                  <p className="mt-2">{companyName} respects the privacy of all clients and handles personal information carefully. Any personal information or documents provided by the client will be used only for the purpose of preparing and managing the immigration application and providing related consulting services. Information may be shared with immigration authorities or other necessary service providers only when required for the application process.</p>
                  <p className="mt-2">By continuing with this agreement, the client confirms that they understand the services being provided, the responsibilities associated with the immigration process, and the professional fees associated with the service. The client also confirms that they are voluntarily requesting assistance from {companyName} and agree to proceed with the consulting services described.</p>
                  <p className="mt-2">By clicking &quot;I Agree&quot; or signing electronically, the client confirms that they have read and understood this agreement and agree to proceed with the services provided by {companyName}.</p>
                </div>

                {c.retainerSigned ? (
                  <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                    Retainer signed on {c.retainerRecord?.signedAt ? new Date(c.retainerRecord.signedAt).toLocaleString() : "recorded"} by{" "}
                    {(() => {
                      const signedBy = c.retainerRecord?.signerName?.trim();
                      if (!signedBy) return c.client;
                      return signedBy.toLowerCase() === c.client.toLowerCase() ? signedBy : c.client;
                    })()}.
                  </div>
                ) : c.retainerSentAt ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <input value={retainerName} onChange={(e) => setRetainerName(e.target.value)} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm" placeholder="Full legal name" />
                    <select value={retainerSignatureType} onChange={(e) => setRetainerSignatureType(e.target.value as "initials" | "signature" | "typed")} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm">
                      <option value="typed">Typed Name</option>
                      <option value="initials">Initials</option>
                      <option value="signature">Signature</option>
                    </select>
                    <input value={retainerSignatureValue} onChange={(e) => setRetainerSignatureValue(e.target.value)} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder={retainerSignatureType === "initials" ? "Enter initials (e.g. JY)" : retainerSignatureType === "signature" ? "Type signature as you sign" : "Type your full name as e-sign"} />
                    <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={retainerAccepted} onChange={(e) => setRetainerAccepted(e.target.checked)} />
                      I accept the retainer terms and authorize {companyName} to proceed.
                    </label>
                    <button onClick={() => void signRetainer(c.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white md:col-span-2">E-Sign Retainer</button>
                    {retainerStatus ? <p className="md:col-span-2 text-xs text-slate-600">{retainerStatus}</p> : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {clientScreen === "payment" ? (
              <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
                <button onClick={() => setClientScreen("overview")} className="mb-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold">Back to Tasks</button>
                <h3 className="font-semibold">Interac Payment</h3>
                {!c.retainerSigned ? (
                  <p className="mt-2 text-sm text-amber-700">Please sign the retainer first.</p>
                ) : c.paymentStatus === "paid" ? (
                  <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                    Payment confirmed {c.paymentPaidAt ? `on ${new Date(c.paymentPaidAt).toLocaleString()}` : ""}.
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-slate-700">
                      Amount due: <span className="font-semibold">${c.servicePackage.retainerAmount} CAD</span>
                    </p>
                    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p>
                        Send Interac to: <span className="font-semibold">{fixedInteracRecipient}</span>
                      </p>
                      <p className="mt-1">
                        Reference message: <span className="font-semibold">{c.id}</span>
                      </p>
                      <p className="mt-1">{normalizeInteracInstructions(c.interacInstructions)}</p>
                    </div>
                    <a
                      href="https://www.interac.ca/en/consumers/products/interac-e-transfer/"
                      target="_blank"
                      className="inline-block rounded border border-slate-300 px-3 py-2 text-xs font-semibold"
                    >
                      Open Bank
                    </a>
                    <button
                      onClick={() => void copyInteracDetails(c)}
                      className="ml-2 inline-block rounded border border-slate-300 px-3 py-2 text-xs font-semibold"
                    >
                      Copy Payment Details
                    </button>
                    {interacCopyStatus ? <p className="text-xs text-slate-600">{interacCopyStatus}</p> : null}
                    <p className="text-xs text-slate-500">Your bank app cannot be prefilled directly. Use Copy Payment Details, then paste in your bank transfer screen.</p>
                    <p className="text-xs text-slate-500">After payment, {companyName} team will verify and unlock documents/forms.</p>
                  </div>
                )}
              </section>
            ) : null}

            {clientScreen === "overview" ? (
              <>
                <section className="grid gap-3 md:grid-cols-2">
                  {!c.retainerSigned ? (
                    <button onClick={() => setClientScreen("retainer")} className="rounded-xl border-2 border-slate-500 bg-white p-4 text-left shadow-sm">
                      <p className="text-xs text-slate-500">Task</p>
                      <p className="mt-1 text-lg font-semibold">Sign Retainer</p>
                      <p className="text-xs text-slate-500">Pending</p>
                      <p className="mt-2 text-xs font-semibold">[ ] To Do</p>
                    </button>
                  ) : null}
                  {c.paymentStatus !== "paid" ? (
                    <button onClick={() => setClientScreen("payment")} className="rounded-xl border-2 border-slate-500 bg-white p-4 text-left shadow-sm">
                      <p className="text-xs text-slate-500">Task</p>
                      <p className="mt-1 text-lg font-semibold">Complete Payment</p>
                      <p className="text-xs text-slate-500">Pending</p>
                      <p className="mt-2 text-xs font-semibold">[ ] To Do</p>
                    </button>
                  ) : null}
                  <article className="rounded-xl border-2 border-slate-500 bg-white p-4 text-left shadow-sm">
                    <button
                      onClick={() => setClientWorkOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-xs text-slate-500">Workflow</p>
                        <p className="mt-1 text-lg font-semibold">Questions and Documents</p>
                        <p className="text-xs text-slate-500">
                          Questions: {clientIntakeDone ? "Completed" : "Pending"} | Documents: {docsChecklistComplete ? "Completed" : "Pending"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{clientWorkOpen ? "Hide" : "Open"}</span>
                    </button>
                    {clientWorkOpen ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => setClientScreen("questions")} className="rounded border border-slate-400 px-3 py-2 text-xs font-semibold">
                          Open Questions
                        </button>
                        <button onClick={() => setClientScreen("documents")} className="rounded border border-slate-400 px-3 py-2 text-xs font-semibold">
                          Open Documents
                        </button>
                      </div>
                    ) : null}
                  </article>
                </section>
              </>
            ) : null}

            {clientScreen === "questions" ? (
              <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
                <button onClick={() => setClientScreen("overview")} className="mb-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold">Back to Tasks</button>
                <h3 className="font-semibold">Questions</h3>
                <p className="mt-2 text-sm text-slate-700">Complete your questionnaire. System marks this task done automatically when required fields are filled.</p>
                <a
                  href={questionnaireUrl(c.questionnaireLink, c.id)}
                  target="_blank"
                  className="mt-3 inline-block rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-semibold"
                >
                  Open Question Form
                </a>
                <p className="mt-2 text-xs text-slate-500">{clientIntakeDone ? "[✓] Completed" : "[ ] Not completed yet"}</p>
              </section>
            ) : null}

            {clientScreen === "documents" ? (
              <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
                <button onClick={() => setClientScreen("overview")} className="mb-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold">Back to Tasks</button>
                <h3 className="font-semibold">Documents</h3>
                <div className="mt-3 space-y-2">
                  <a href={clientReadyForDocs ? questionnaireUrl(c.questionnaireLink, c.id) : "#"} target="_blank" className={`block rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-semibold ${clientReadyForDocs ? "" : "pointer-events-none opacity-50"}`}>Fill Question Form</a>
                </div>
                {!clientReadyForDocs ? <p className="mt-2 text-xs text-amber-700">Complete retainer e-sign and Interac payment to unlock actions.</p> : null}
                {clientReadyForDocs && openDocRequests.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-900">Additional documents requested by processing team</p>
                    <div className="mt-2 space-y-2">
                      {openDocRequests.map((req) => (
                        <div key={req.id} className="rounded border border-amber-200 bg-white p-2">
                          <p className="text-xs font-semibold text-slate-800">{req.title}</p>
                          {req.details ? <p className="mt-1 text-xs text-slate-600">{req.details}</p> : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input
                              type="file"
                              onChange={(e) =>
                                setRequestedUploadFiles((prev) => ({
                                  ...prev,
                                  [req.id]: e.target.files?.[0] ?? null
                                }))
                              }
                              className="text-xs"
                            />
                            <button
                              onClick={() => void uploadRequestedDocument(c.id, req)}
                              className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Upload Requested File
                            </button>
                          </div>
                          {requestedUploadStatus[req.id] ? (
                            <p className="mt-1 text-xs text-slate-600">{requestedUploadStatus[req.id]}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {clientReadyForDocs ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{c.formType} Document Checklist</p>
                    <div className="mt-2 space-y-2">
                      {caseChecklist.map((item) => {
                        const uploaded = isChecklistDocUploaded(item);
                        return (
                          <div key={item.key} className="rounded border border-slate-200 bg-white p-2">
                            <p className="text-xs font-semibold text-slate-800">
                              {uploaded ? "[Uploaded] " : "[Pending] "}
                              {item.label}
                              {item.required === false ? " (Optional)" : ""}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <input
                                type="file"
                                onChange={(e) =>
                                  setChecklistFiles((prev) => ({
                                    ...prev,
                                    [item.key]: e.target.files?.[0] ?? null
                                  }))
                                }
                                className="text-xs"
                              />
                              <button
                                onClick={() => void uploadChecklistDocument(c.id, item)}
                                className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Upload
                              </button>
                            </div>
                            {checklistStatus[item.key] ? (
                              <p className="mt-1 text-xs text-slate-600">{checklistStatus[item.key]}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {clientReadyForDocs ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">Extra Document Upload (Optional)</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        onChange={(e) => setClientUploadFile(e.target.files?.[0] ?? null)}
                        className="text-xs"
                      />
                      <button
                        onClick={() => void uploadClientDocument(c.id)}
                        className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Upload Extra File
                      </button>
                    </div>
                    {clientUploadStatus ? <p className="mt-2 text-xs text-slate-600">{clientUploadStatus}</p> : null}
                  </div>
                ) : null}
                <div className="mt-3 space-y-2">
                  {documents.map((d) => (
                    <article key={d.id} className="rounded border border-slate-200 p-2 text-sm">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.status}</p>
                      {d.link ? (
                        <a href={d.link} target="_blank" className="text-xs text-blue-700 underline">
                          Open file
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {clientScreen === "chat" ? (
              <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
                <h3 className="font-semibold">Chat</h3>
                <p className="mt-1 text-xs text-slate-500">All messages are saved to your case and visible to Newton team.</p>
                <div className="mt-3 max-h-60 space-y-2 overflow-auto rounded border border-slate-200 p-2 text-sm">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded bg-slate-50 p-2">
                      <p className="text-xs font-medium text-slate-600">{m.senderName}</p>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={chatText} onChange={(e) => setChatText(e.target.value)} className="flex-1 rounded border-2 border-slate-300 px-2 py-2 text-sm" placeholder="Type message" />
                  <button onClick={() => void sendMessage("human")} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Send</button>
                  <button onClick={() => void sendMessage("ai")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">AI</button>
                </div>
                {chatStatus ? <p className="mt-1 text-xs text-slate-600">{chatStatus}</p> : null}
              </section>
            ) : null}
          </>
        ) : null}
        <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Contact Us</h3>
          <p className="mt-1 text-sm text-slate-700">For payment assistance call at <span className="font-semibold">{paymentSupportPhone}</span>.</p>
          <p className="mt-1 text-sm text-slate-700">For case processing call at <span className="font-semibold">{processingSupportPhone}</span>.</p>
          <a
            href="https://www.franco.app"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
              F
            </span>
            Want to learn French to smoothen your immigration journey? Visit franco.app
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Header {...headerProps} />

      <section className="rounded-2xl border-2 border-slate-300 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Signed in</p>
            <p className="text-sm font-semibold text-slate-900">
              {sessionUser.name} ({sessionUser.role})
            </p>
            <p className="text-xs text-slate-500">{company ? `Portal: /portal/${company.slug}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
              >
                <Bell size={14} className="inline mr-1" />
                Alerts ({notifications.filter((n) => !n.read).length})
              </button>
              {showNotifications ? (
                <div className="absolute right-0 z-20 mt-1 w-80 rounded-lg border border-slate-300 bg-white p-2 shadow">
                  <p className="px-2 py-1 text-xs font-semibold text-slate-600">Notifications</p>
                  <div className="max-h-64 overflow-auto space-y-1">
                    {notifications.slice(0, 10).map((n) => (
                      <div key={n.id} className="rounded border border-slate-200 p-2 text-xs">
                        <p>{n.message}</p>
                        <p className="text-slate-500">{n.type}</p>
                      </div>
                    ))}
                    {notifications.length === 0 ? <p className="px-2 py-1 text-xs text-slate-500">No alerts.</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
            <select value={viewRole} onChange={(e) => setViewRole(e.target.value as Role)} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold">
              <option>Admin</option>
              <option>Owner</option>
              <option>Reviewer</option>
            </select>
            <button onClick={logout} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold">
              <LogOut size={14} className="inline mr-1" /> Logout
            </button>
          </div>
        </div>
      </section>

      {error ? <section className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</section> : null}

      <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border-2 border-slate-300 bg-white p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {company ? `${company.name} Workspace` : "Company Workspace"}
          </p>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id)}
                className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold ${
                  screen === tab.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Search Case</p>
            <input
              value={caseSearch}
              onChange={(e) => setCaseSearch(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 px-2 py-2 text-sm"
              placeholder="Search by case id, client, or application"
            />
          </div>
        </aside>

        <section className="space-y-4">
          {screen === "dashboard" ? (
            <>
              <section className="grid gap-3 md:grid-cols-3">
                <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
                  <p className="text-xs text-slate-500">Urgent</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {visibleCases.filter((c) => Boolean(c.isUrgent)).length}
                  </p>
                </article>
                <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
                  <p className="text-xs text-slate-500">Waiting on Client</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {visibleCases.filter((c) => c.aiStatus === "waiting_client").length}
                  </p>
                </article>
                <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
                  <p className="text-xs text-slate-500">In Progress</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {visibleCases.filter((c) => (c.caseStatus || "lead") === "active").length}
                  </p>
                </article>
              </section>

              <section className="grid gap-3 md:grid-cols-2">
                <article className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                  <h3 className="text-base font-semibold">Pipeline Summary</h3>
                  <div className="mt-2 grid gap-2 grid-cols-2 text-xs">
                    <div className="rounded border border-slate-200 p-2">Lead: {caseCounts.lead}</div>
                    <div className="rounded border border-slate-200 p-2">Active: {caseCounts.active}</div>
                    <div className="rounded border border-slate-200 p-2">Under Review: {caseCounts.under_review}</div>
                    <div className="rounded border border-slate-200 p-2">Submitted: {caseCounts.submitted}</div>
                  </div>
                </article>
                <article className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                  <h3 className="text-base font-semibold">Quick Actions</h3>
                  <input
                    value={leadSheetCsvUrl}
                    onChange={(e) => setLeadSheetCsvUrl(e.target.value)}
                    className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                    placeholder="Google Sheet CSV export URL (optional override)"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => setScreen("cases")} className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold">Open Cases</button>
                    <button onClick={() => setScreen("communications")} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Create Case</button>
                    <button onClick={() => void syncLeadsFromSheet()} className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Sync Leads</button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">System drives stages automatically from payment, intake and task completion.</p>
                  {leadSyncStatus ? <p className="mt-1 text-xs text-slate-700">{leadSyncStatus}</p> : null}
                </article>
              </section>

              <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                <h3 className="text-base font-semibold">Today Focus</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {visibleCases.slice(0, 6).map((c) => (
                    <button key={c.id} onClick={() => { setSelectedCaseId(c.id); setScreen("cases"); }} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-left">
                      <p className="text-sm font-semibold">{c.id} - {c.client}</p>
                      <p className="text-xs text-slate-500">{c.formType} • {c.stage}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                <h3 className="text-base font-semibold">Company Branding</h3>
                <p className="mt-1 text-xs text-slate-500">Set company name, logo, and main Google Drive link.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input value={brandAppName} onChange={(e) => setBrandAppName(e.target.value)} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm" placeholder="App name" />
                  <input value={brandLogoText} onChange={(e) => setBrandLogoText(e.target.value)} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm" placeholder="Header label text" />
                  <input value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm" placeholder="Logo image URL (https://...)" />
                  <input value={brandDriveRootLink} onChange={(e) => setBrandDriveRootLink(e.target.value)} className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm" placeholder="Main Google Drive folder link" />
                </div>
                <button onClick={() => void saveBranding()} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                  Save Branding
                </button>
                {brandStatus ? <p className="mt-2 text-xs text-slate-600">{brandStatus}</p> : null}
              </section>
            </>
          ) : null}

          {screen === "cases" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              {caseBoardView === "home" ? (
                <>
                  <h3 className="text-base font-semibold">Case Screens</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <button onClick={() => setCaseBoardView("new_cases")} className="rounded-xl border-2 border-slate-300 bg-white p-4 text-left">
                      <p className="text-xs text-slate-500">Queue</p>
                      <p className="mt-1 text-lg font-semibold">New Cases</p>
                      <p className="text-xs text-slate-500">{newCasesList.length} case(s)</p>
                    </button>
                    <button onClick={() => setCaseBoardView("under_review_cases")} className="rounded-xl border-2 border-slate-300 bg-white p-4 text-left">
                      <p className="text-xs text-slate-500">Queue</p>
                      <p className="mt-1 text-lg font-semibold">Under Review</p>
                      <p className="text-xs text-slate-500">{underReviewCasesList.length} case(s)</p>
                    </button>
                    <button onClick={() => setCaseBoardView("all_cases")} className="rounded-xl border-2 border-slate-300 bg-white p-4 text-left">
                      <p className="text-xs text-slate-500">Queue</p>
                      <p className="mt-1 text-lg font-semibold">All Cases</p>
                      <p className="text-xs text-slate-500">{visibleCases.length} case(s)</p>
                    </button>
                    <button onClick={() => setCaseBoardView("urgent_cases")} className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-left">
                      <p className="text-xs text-red-700">Queue</p>
                      <p className="mt-1 text-lg font-semibold text-red-800">Urgent Cases</p>
                      <p className="text-xs text-red-700">{visibleCases.filter((c) => Boolean(c.isUrgent)).length} case(s)</p>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                      {caseBoardView === "new_cases"
                        ? "New Cases"
                        : caseBoardView === "under_review_cases"
                          ? "Under Review Cases"
                          : caseBoardView === "urgent_cases"
                            ? "Urgent Cases"
                          : "All Cases"}
                    </h3>
                    <button onClick={() => setCaseBoardView("home")} className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold">
                      Back
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {activeCaseBoardList.map((c) => (
                      <article
                        key={c.id}
                        className={`rounded-lg border p-3 text-left text-xs ${
                          selectedCase?.id === c.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="grid gap-2 md:grid-cols-6">
                          <div>
                            <p className="text-[11px] text-slate-500">Name</p>
                            <p className="font-semibold">{c.client}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">Type</p>
                            <p className="font-semibold">{c.formType}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">AI Status</p>
                            <p className="font-semibold">{c.aiStatus || "idle"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">Case Status</p>
                            <p className="font-semibold">{c.caseStatus || "lead"}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">Deadline</p>
                            <p className="font-semibold">{c.dueInDays} day(s)</p>
                          </div>
                          <div className="flex items-end justify-end gap-2">
                            <button onClick={() => setSelectedCaseId(c.id)} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold">
                              Open
                            </button>
                            <button onClick={() => void runCaseNextAction(c)} className="rounded bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white">
                              {getCaseNextAction(c).label}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                    {activeCaseBoardList.length === 0 ? (
                      <p className="text-xs text-slate-500">No cases in this screen.</p>
                    ) : null}
                  </div>
                </>
              )}

              {selectedCase ? (
                <>
                  <div className="mt-3 rounded-lg border-2 border-slate-300 p-3">
                    <p className="text-sm font-semibold">Case Detail</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => setCaseDetailTab("overview")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "overview" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Overview</button>
                      <button onClick={() => setCaseDetailTab("documents")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "documents" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Documents</button>
                      <button onClick={() => setCaseDetailTab("tasks")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "tasks" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Tasks</button>
                      <button onClick={() => setCaseDetailTab("communication")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "communication" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Communication</button>
                    </div>

                    {caseDetailTab === "overview" ? (
                      <div className="mt-3 grid gap-2 md:grid-cols-4 text-xs">
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">Case Status</p>
                          <p className="font-semibold">{selectedCase.caseStatus || "lead"}</p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">AI Status</p>
                          <p className="font-semibold">{selectedCase.aiStatus || "idle"}</p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">Payment</p>
                          <p className="font-semibold">{selectedCase.paymentStatus || "pending"}</p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">Pending Fees</p>
                          <p className="font-semibold">
                            $
                            {selectedCase.paymentStatus === "paid"
                              ? Number(selectedCase.servicePackage.balanceAmount || 0)
                              : Number(selectedCase.servicePackage.retainerAmount || 0)}{" "}
                            CAD
                          </p>
                        </div>
                        <div className="rounded border border-slate-200 p-2 md:col-span-4">
                          <p className="text-slate-500">Payment Action</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <button
                              onClick={() => void sendPaymentLinkForCase()}
                              className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Send Payment Link
                            </button>
                            {selectedCase.paymentStatus !== "paid" ? (
                              <button
                                onClick={() => void confirmInteracReceived()}
                                className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Confirm Interac Received
                              </button>
                            ) : (
                              <span className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                Payment Confirmed
                              </span>
                            )}
                            {inviteUrl ? (
                              <a href={inviteUrl} target="_blank" className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-blue-700 underline">
                                Open Invite Link
                              </a>
                            ) : null}
                          </div>
                          {paymentLinkStatus ? <p className="mt-1 text-xs text-slate-700">{paymentLinkStatus}</p> : null}
                        </div>
                      </div>
                    ) : null}

                    {caseDetailTab === "documents" ? (
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded border border-slate-300 bg-slate-50 p-2">
                          <p className="font-semibold">Request More Documents</p>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <input
                              value={staffDocRequestTitle}
                              onChange={(e) => setStaffDocRequestTitle(e.target.value)}
                              className="rounded border border-slate-300 px-2 py-2"
                              placeholder="Document name (e.g. Updated bank statement)"
                            />
                            <input
                              value={staffDocRequestDetails}
                              onChange={(e) => setStaffDocRequestDetails(e.target.value)}
                              className="rounded border border-slate-300 px-2 py-2"
                              placeholder="Details/instructions for client"
                            />
                          </div>
                          <button
                            onClick={() => void createStaffDocRequest()}
                            className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Send Request to Client Portal
                          </button>
                          {staffDocRequestStatus ? <p className="mt-1 text-slate-700">{staffDocRequestStatus}</p> : null}
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="font-semibold">Requested Documents Status</p>
                          <div className="mt-2 space-y-2">
                            {docRequests.map((r) => (
                              <div key={r.id} className="rounded border border-slate-200 p-2">
                                <p className="font-semibold">{r.title}</p>
                                {r.details ? <p className="text-slate-600">{r.details}</p> : null}
                                <p className="text-slate-500">
                                  {r.status} • requested by {r.requestedBy}
                                  {r.fulfilledAt ? ` • fulfilled ${new Date(r.fulfilledAt).toLocaleString()}` : ""}
                                </p>
                              </div>
                            ))}
                            {docRequests.length === 0 ? <p className="text-slate-500">No extra requests yet.</p> : null}
                          </div>
                        </div>
                        {documents.map((d) => (
                          <div key={d.id} className="rounded border border-slate-200 p-2">
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-slate-500">{d.status}</p>
                            {d.link ? <a href={d.link} target="_blank" className="text-blue-700 underline">Open</a> : null}
                          </div>
                        ))}
                        {documents.length === 0 ? <p className="text-slate-500">No documents uploaded yet.</p> : null}
                      </div>
                    ) : null}

                    {caseDetailTab === "communication" ? (
                      <div className="mt-3">
                        <div className="max-h-56 space-y-2 overflow-auto rounded border border-slate-200 p-2 text-xs">
                          {messages.map((m) => (
                            <div key={m.id} className="rounded bg-slate-50 p-2">
                              <p className="font-semibold text-slate-600">{m.senderName}</p>
                              <p>{m.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input value={chatText} onChange={(e) => setChatText(e.target.value)} className="flex-1 rounded border border-slate-300 px-2 py-2 text-xs" placeholder="Write message" />
                          <button onClick={() => void sendMessage("human")} className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Send</button>
                          <button onClick={() => void sendMessage("ai")} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">AI</button>
                        </div>
                        {chatStatus ? <p className="mt-1 text-xs text-slate-600">{chatStatus}</p> : null}
                      </div>
                    ) : null}

                    {caseDetailTab === "tasks" ? (
                      <div className="mt-3 text-xs">
                        <div className="grid gap-2 md:grid-cols-3">
                          <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="rounded border border-slate-300 px-2 py-2" placeholder="Task title" />
                          <input value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} className="rounded border border-slate-300 px-2 py-2" placeholder="Description" />
                          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high")} className="rounded border border-slate-300 px-2 py-2">
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                          </select>
                        </div>
                        <button onClick={() => void createCaseTask()} className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                          Add Task
                        </button>
                        {taskActionStatus ? <p className="mt-1 text-slate-700">{taskActionStatus}</p> : null}
                        <div className="mt-2 space-y-2">
                          {caseTasks.map((t) => (
                            <div key={t.id} className="rounded border border-slate-200 p-2">
                              <p className="font-semibold">{t.title}</p>
                              <p className="text-slate-500">{t.priority} • {t.status}</p>
                              {t.description ? <p>{t.description}</p> : null}
                              {t.status !== "completed" ? (
                                <button onClick={() => void markTaskCompleted(t.id)} className="mt-1 rounded border border-slate-300 px-2 py-1 text-xs font-semibold">
                                  Mark Completed
                                </button>
                              ) : null}
                            </div>
                          ))}
                          {caseTasks.length === 0 ? <p className="text-slate-500">No tasks for this case yet.</p> : null}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                          Completing task title containing \"Review application\" auto-moves case to READY.
                        </p>
                      </div>
                    ) : null}

                  </div>
                </>
              ) : null}
            </section>
          ) : null}

          {screen === "chat" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Case Chat</h3>
              <select value={selectedCase?.id ?? ""} onChange={(e) => setSelectedCaseId(e.target.value)} className="mt-2 w-full rounded-lg border-2 border-slate-300 px-2 py-2 text-sm">
                {visibleCases.map((c) => <option key={c.id} value={c.id}>{c.id} - {c.client}</option>)}
              </select>

              <div className="mt-3 max-h-72 space-y-2 overflow-auto rounded border border-slate-200 p-2 text-sm">
                {messages.map((m) => (
                  <div key={m.id} className="rounded bg-slate-50 p-2">
                    <p className="text-xs font-semibold text-slate-600">{m.senderName}</p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex gap-2">
                <input value={chatText} onChange={(e) => setChatText(e.target.value)} className="flex-1 rounded-lg border-2 border-slate-300 px-2 py-2 text-sm" placeholder="Write message" />
                <button onClick={() => void sendMessage("human")} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Send</button>
                <button onClick={() => void sendMessage("ai")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">AI</button>
              </div>
              {chatStatus ? <p className="mt-1 text-xs text-slate-600">{chatStatus}</p> : null}
            </section>
          ) : null}

          {screen === "communications" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Communications</h3>
              <p className="mt-1 text-xs text-slate-500">Create and share client link, payment details, and message templates.</p>

              <select
                value={selectedCase?.id ?? ""}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="mt-3 w-full rounded-lg border-2 border-slate-300 px-2 py-2 text-sm"
              >
                {visibleCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.client}
                  </option>
                ))}
              </select>

              <div className="mt-3 space-y-3">
                <article className="rounded-lg border-2 border-slate-300 p-3">
                  <p className="text-sm font-semibold">Payment Confirmation</p>
                  <p className="mt-1 text-xs text-slate-500">Search case and confirm Interac payment here.</p>
                  <input
                    value={commSearch}
                    onChange={(e) => setCommSearch(e.target.value)}
                    placeholder="Search by case ID, client name, or application type"
                    className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                  />
                  <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded border border-slate-200 p-2">
                    {communicationSearchList.map((c) => (
                      <div key={c.id} className="rounded border border-slate-200 p-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedCaseId(c.id)}
                            className="font-semibold text-blue-700 underline"
                          >
                            {c.id} - {c.client}
                          </button>
                          <span className={`rounded px-2 py-1 text-[10px] font-semibold ${c.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {c.paymentStatus || "pending"}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-500">{c.formType}</p>
                        {c.paymentStatus !== "paid" ? (
                          <button
                            onClick={() => void confirmInteracReceivedForCase(c.id, "communications")}
                            className="mt-2 rounded bg-emerald-600 px-2 py-1 font-semibold text-white"
                          >
                            Confirm Payment
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {communicationSearchList.length === 0 ? (
                      <p className="text-xs text-slate-500">No matching cases found.</p>
                    ) : null}
                  </div>
                  {commPaymentStatus ? <p className="mt-2 text-xs text-slate-700">{commPaymentStatus}</p> : null}
                </article>

                <article className="rounded-lg border-2 border-slate-300 p-3">
                  <p className="text-sm font-semibold">Create Case</p>
                  <p className="mt-1 text-xs text-slate-500">Create a new client case before generating invite/payment link.</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <input
                      value={commClientName}
                      onChange={(e) => setCommClientName(e.target.value)}
                      placeholder="Client full name"
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    />
                    <select
                      value={commFormType}
                      onChange={(e) => setCommFormType(e.target.value)}
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    >
                      {APPLICATION_TYPES.map((appType) => (
                        <option key={appType} value={appType}>
                          {appType}
                        </option>
                      ))}
                    </select>
                    <input
                      value={commPhone}
                      onChange={(e) => setCommPhone(e.target.value)}
                      placeholder="Phone number"
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={commUrgent}
                        onChange={(e) => setCommUrgent(e.target.checked)}
                      />
                      Urgent basis
                    </label>
                    {commUrgent ? (
                      <input
                        value={commUrgentDays}
                        onChange={(e) => setCommUrgentDays(e.target.value)}
                        placeholder="Deadline days"
                        className="w-36 rounded border border-slate-300 px-2 py-2 text-xs"
                      />
                    ) : null}
                  </div>
                  <button onClick={() => void createCaseFromCommunications()} className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                    Create Case
                  </button>
                  {commCreateStatus ? <p className="mt-1 text-xs text-slate-700">{commCreateStatus}</p> : null}
                </article>

                {sessionUser?.role === "Admin" && sessionUser?.userType === "staff" ? (
                  <article className="rounded-lg border-2 border-rose-300 bg-rose-50 p-3">
                    <p className="text-sm font-semibold text-rose-900">Admin Cleanup: Keep Only Real Cases</p>
                    <p className="mt-1 text-xs text-rose-800">
                      This removes all other test/demo cases and keeps only the IDs you enter.
                    </p>
                    <input
                      value={commPruneCaseIds}
                      onChange={(e) => setCommPruneCaseIds(e.target.value)}
                      placeholder="CASE-1006, CASE-1007"
                      className="mt-2 w-full rounded border border-rose-300 px-2 py-2 text-xs"
                    />
                    <button
                      onClick={() => void pruneToRealCases()}
                      className="mt-2 rounded bg-rose-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Keep Only These Cases
                    </button>
                    {commPruneStatus ? <p className="mt-2 text-xs text-rose-900">{commPruneStatus}</p> : null}
                  </article>
                ) : null}

                {selectedCase ? (
                  <article className="rounded-lg border-2 border-slate-300 p-3">
                    <p className="text-sm font-semibold">Invite Link</p>
                    <p className="mt-1 text-xs text-slate-500">Set application and amount, then generate one client link.</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <select
                        value={setupFormType}
                        onChange={(e) => setSetupFormType(e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                      >
                        {APPLICATION_TYPES.map((appType) => (
                          <option key={appType} value={appType}>
                            {appType}
                          </option>
                        ))}
                      </select>
                      <input
                        value={setupRetainerAmount}
                        onChange={(e) => setSetupRetainerAmount(e.target.value)}
                        placeholder="Retainer amount (CAD)"
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                      />
                      <input
                        value={setupInteracInstructions}
                        onChange={(e) => setSetupInteracInstructions(e.target.value)}
                        placeholder="Interac instructions"
                        className="rounded border border-slate-300 px-2 py-2 text-xs md:col-span-2"
                      />
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Client email (optional)"
                        className="rounded border border-slate-300 px-2 py-2 text-xs md:col-span-2"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => void sendPaymentLinkForCase()} className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                        Create Invite + Payment Link
                      </button>
                    </div>
                    {inviteStatus ? <p className="mt-2 text-xs text-slate-700">{inviteStatus}</p> : null}
                    {paymentLinkStatus ? <p className="mt-1 text-xs text-slate-700">{paymentLinkStatus}</p> : null}
                    {inviteUrl ? (
                      <a href={inviteUrl} target="_blank" className="mt-2 block break-all text-xs text-blue-700 underline">
                        {inviteUrl}
                      </a>
                    ) : null}
                  </article>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Create or select a case to generate the invite link.</p>
                )}
              </div>
            </section>
          ) : null}

          {screen === "accounting" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Accounting</h3>
              <p className="mt-1 text-xs text-slate-500">Track paid amount and pending fees for each client.</p>
              <input
                value={accountingSearch}
                onChange={(e) => setAccountingSearch(e.target.value)}
                className="mt-3 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                placeholder="Search by case id, client, or application"
              />
              <div className="mt-3 space-y-2">
                {visibleCases
                  .filter((c) => {
                    const q = accountingSearch.trim().toLowerCase();
                    if (!q) return true;
                    return `${c.id} ${c.client} ${c.formType}`.toLowerCase().includes(q);
                  })
                  .map((c) => {
                    const total = Number(c.servicePackage.retainerAmount || 0);
                    const paid = Number(c.amountPaid || 0);
                    const remaining = Math.max(0, total - paid);
                    return (
                      <article key={c.id} className="rounded border border-slate-200 p-3 text-xs">
                        <div className="grid gap-2 md:grid-cols-6">
                          <div>
                            <p className="text-slate-500">Case</p>
                            <p className="font-semibold">{c.id}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Client</p>
                            <p className="font-semibold">{c.client}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Application</p>
                            <p className="font-semibold">{c.formType}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Total Fee</p>
                            <p className="font-semibold">${total}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Paid</p>
                            <p className="font-semibold">${paid}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Pending</p>
                            <p className="font-semibold">${remaining}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <input
                            value={accountingAmount[c.id] || ""}
                            onChange={(e) =>
                              setAccountingAmount((prev) => ({
                                ...prev,
                                [c.id]: e.target.value
                              }))
                            }
                            className="w-44 rounded border border-slate-300 px-2 py-2 text-xs"
                            placeholder="Amount received now"
                          />
                          <button
                            onClick={() => void recordAccountingPayment(c.id)}
                            className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Record Payment
                          </button>
                        </div>
                      </article>
                    );
                  })}
                {visibleCases.length === 0 ? <p className="text-xs text-slate-500">No cases found.</p> : null}
              </div>
              {accountingStatus ? <p className="mt-2 text-xs text-slate-700">{accountingStatus}</p> : null}
            </section>
          ) : null}

          {screen === "tasks" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Team Tasks</h3>
              <div className="mt-2 grid gap-2 md:grid-cols-4">
                <article className="rounded border border-slate-300 p-2 text-xs">
                  <p className="text-slate-500">All</p>
                  <p className="text-lg font-semibold">{tasks.length}</p>
                </article>
                <article className="rounded border border-slate-300 p-2 text-xs">
                  <p className="text-slate-500">Pending</p>
                  <p className="text-lg font-semibold">{tasks.filter((t) => t.status === "pending").length}</p>
                </article>
                <article className="rounded border border-slate-300 p-2 text-xs">
                  <p className="text-slate-500">High Priority</p>
                  <p className="text-lg font-semibold">{tasks.filter((t) => t.priority === "high" && t.status === "pending").length}</p>
                </article>
                <article className="rounded border border-slate-300 p-2 text-xs">
                  <p className="text-slate-500">Completed</p>
                  <p className="text-lg font-semibold">{tasks.filter((t) => t.status === "completed").length}</p>
                </article>
              </div>
              <div className="mt-3 space-y-2">
                {tasks.map((t) => (
                  <article key={t.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.caseId} • {t.priority} • {t.status} • assigned: {t.assignedTo}
                    </p>
                    {t.description ? <p className="mt-1 text-xs">{t.description}</p> : null}
                    {t.status !== "completed" ? (
                      <button
                        onClick={() => void markTaskCompleted(t.id)}
                        className="mt-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                      >
                        Mark Completed
                      </button>
                    ) : null}
                  </article>
                ))}
                {tasks.length === 0 ? <p className="text-xs text-slate-500">No tasks available.</p> : null}
              </div>
            </section>
          ) : null}

          {screen === "files" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Files and Documents</h3>
              <select value={selectedCase?.id ?? ""} onChange={(e) => setSelectedCaseId(e.target.value)} className="mt-2 w-full rounded-lg border-2 border-slate-300 px-2 py-2 text-sm">
                {visibleCases.map((c) => <option key={c.id} value={c.id}>{c.id} - {c.client}</option>)}
              </select>

              <div className="mt-3 space-y-2">
                {documents.map((d) => (
                  <article key={d.id} className="rounded-lg border-2 border-slate-300 p-3 text-sm">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-slate-500">Status: {d.status}</p>
                  </article>
                ))}
              </div>

              <form className="mt-3 grid gap-2 md:grid-cols-3" onSubmit={addDocument}>
                <input name="name" placeholder="Document name" className="rounded-lg border-2 border-slate-300 px-2 py-2 text-sm" />
                <input name="link" placeholder="Drive link" className="rounded-lg border-2 border-slate-300 px-2 py-2 text-sm" />
                <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Add Document</button>
              </form>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
