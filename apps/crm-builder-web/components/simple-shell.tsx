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
import { getChecklistForFormType, resolveApplicationChecklistKey } from "@/lib/application-checklists";
import { isQuestionnaireComplete } from "@/lib/application-question-flows";
import { canCreateCase, canManageUsers, tabsForRole, type AppScreen } from "@/lib/rbac";

type Screen = AppScreen;
type ClientScreen = "retainer" | "overview" | "documents" | "questions" | "results" | "chat";
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

type OutboundMessageItem = {
  id: string;
  channel: "email" | "whatsapp" | "sms" | "link" | "copy";
  status: "queued" | "opened_app" | "sent" | "failed";
  target?: string;
  message: string;
  createdByName: string;
  createdAt: string;
};

type DocumentItem = {
  id: string;
  clientId?: string;
  name: string;
  category?: "general" | "result";
  fileType?: string;
  version?: number;
  versionGroupId?: string;
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
type LegacyResultItem = {
  id: string;
  clientName: string;
  phone?: string;
  applicationNumber: string;
  resultDate: string;
  autoCategory: "new" | "old";
  outcome: "approved" | "refused" | "request_letter" | "other";
  notes?: string;
  fileName?: string;
  fileLink?: string;
  matchedCaseId?: string;
  matchedClientId?: string;
  informedToClient?: boolean;
  informedAt?: string;
  informedByName?: string;
  createdAt: string;
};
type CustomPortalSection = {
  id: string;
  title: string;
  body: string;
  fieldType?: "text" | "dropdown" | "date" | "file_upload" | "checkbox";
  options?: string[];
  visibleFor?: string[];
  sortOrder?: number;
  enabled?: boolean;
};
type CustomPortalSectionVersion = {
  id: string;
  createdAt: string;
  actorName?: string;
  sections: CustomPortalSection[];
};

const PORTAL_FIELD_TYPES: Array<CustomPortalSection["fieldType"]> = [
  "text",
  "dropdown",
  "date",
  "file_upload",
  "checkbox"
];
const PORTAL_VISIBILITY_OPTIONS = [
  "all",
  "pgwp",
  "visitor_visa",
  "trv_inside",
  "visitor_record",
  "work_permit",
  "study_permit",
  "study_permit_extension",
  "super_visa",
  "express_entry",
  "family_sponsorship",
  "citizenship_prcard",
  "us_b1b2",
  "uk_visitor",
  "refugee",
  "canadian_passport_doc",
  "generic"
];
type AuditItem = {
  id: string;
  action: string;
  actorName: string;
  resourceId: string;
  createdAt: string;
  metadata?: Record<string, string>;
};
type TeamUserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  mfaEnabled?: boolean;
  workspaceDriveLink?: string;
  workspaceDriveFolderId?: string;
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
type CaseDetailTab = "overview" | "profile" | "documents" | "tasks" | "communication";
type CaseBoardView = "home" | "new_cases" | "assigned_cases" | "under_review_cases" | "urgent_cases" | "all_cases";

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
  "Webform Submission",
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
  "Other"
];

const PROCESSING_TEAM_MEMBERS: string[] = [
  "Unassigned",
  "sarbleen",
  "rapneet",
  "eknoor",
  "simi",
  "ramandeep",
  "rajwinder",
  "avneet"
];

const PROCESSING_STATUS_OPTIONS: Array<{ value: "docs_pending" | "under_review" | "submitted" | "other"; label: string }> = [
  { value: "docs_pending", label: "Docs Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "submitted", label: "Submitted" },
  { value: "other", label: "Other" }
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

type DiagnosticsCheck = {
  id: string;
  title: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

type DiagnosticsReport = {
  generatedAt: string;
  summary: {
    overall: "pass" | "warn" | "fail";
    failCount: number;
    warnCount: number;
    passCount: number;
    total: number;
  };
  checks: DiagnosticsCheck[];
};

const tabs: { id: Screen; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "cases", label: "Cases", icon: <Users size={16} /> },
  { id: "communications", label: "Communications", icon: <MessageCircle size={16} /> },
  { id: "results", label: "Results", icon: <FileText size={16} /> },
  { id: "submission", label: "Submission", icon: <FileText size={16} /> },
  { id: "accounting", label: "Accounting", icon: <FileText size={16} /> },
  { id: "settings", label: "Settings", icon: <FileText size={16} /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare size={16} /> },
  { id: "chat", label: "Chat", icon: <MessageCircle size={16} /> },
  { id: "files", label: "Files", icon: <FileText size={16} /> }
];

function filterCasesByRole(allCases: CaseItem[], role: Role) {
  if (role === "Client") return [];
  return allCases;
}

function questionnaireUrl(link: string | undefined, caseId: string) {
  const clean = (link ?? "").trim();
  if (!clean) return `/questionnaire/${caseId}`;
  if (clean.includes("newton.local")) return `/questionnaire/${caseId}`;
  return clean;
}

function clientAccessLinkFromPayload(payload: any) {
  return String(payload?.portalInviteUrl || payload?.inviteUrl || "");
}

type SimpleShellProps = {
  expectedSlug?: string;
};

export function SimpleShell({ expectedSlug }: SimpleShellProps) {
  const fixedInteracRecipient =
    process.env.NEXT_PUBLIC_INTERAC_RECIPIENT || "payments@newtonimmigration.ca";
  const allowDataDelete = process.env.NEXT_PUBLIC_ALLOW_DATA_DELETE === "true";
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
  const [outboundMessages, setOutboundMessages] = useState<OutboundMessageItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [resultUploadFile, setResultUploadFile] = useState<File | null>(null);
  const [resultUploadName, setResultUploadName] = useState("");
  const [resultUploadStatus, setResultUploadStatus] = useState("");
  const [resultSearch, setResultSearch] = useState("");
  const [resultApplicationNumber, setResultApplicationNumber] = useState("");
  const [resultCaseNumberInput, setResultCaseNumberInput] = useState("");
  const [resultOutcome, setResultOutcome] = useState<"" | "approved" | "refused" | "request_letter">("");
  const [resultDecisionDate, setResultDecisionDate] = useState("");
  const [resultRemarks, setResultRemarks] = useState("");
  const [resultDecisionStatus, setResultDecisionStatus] = useState("");
  const [resultShareStatus, setResultShareStatus] = useState("");
  const [resultSendEmail, setResultSendEmail] = useState("");
  const [resultSendPhone, setResultSendPhone] = useState("");
  const [legacyResultClientName, setLegacyResultClientName] = useState("");
  const [legacyResultPhone, setLegacyResultPhone] = useState("");
  const [legacyResultDate, setLegacyResultDate] = useState(new Date().toISOString().slice(0, 10));
  const [legacyResultOutcome, setLegacyResultOutcome] = useState<"approved" | "refused" | "request_letter" | "other">("other");
  const [legacyResultNotes, setLegacyResultNotes] = useState("");
  const [legacyResultFile, setLegacyResultFile] = useState<File | null>(null);
  const [legacyResultStatus, setLegacyResultStatus] = useState("");
  const [legacyResults, setLegacyResults] = useState<LegacyResultItem[]>([]);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionApplicationNumber, setSubmissionApplicationNumber] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submissionUploadType, setSubmissionUploadType] = useState<"submission_letter" | "wp_extension_letter">(
    "submission_letter"
  );
  const [submissionUploadFile, setSubmissionUploadFile] = useState<File | null>(null);
  const [submissionUploadStatus, setSubmissionUploadStatus] = useState("");
  const [docRequests, setDocRequests] = useState<DocRequestItem[]>([]);
  const [clientIntakeDone, setClientIntakeDone] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [auditStatus, setAuditStatus] = useState("");
  const [teamUsers, setTeamUsers] = useState<TeamUserItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [caseDetailTab, setCaseDetailTab] = useState<CaseDetailTab>("overview");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [teamTaskCaseId, setTeamTaskCaseId] = useState("");
  const [teamTaskTitle, setTeamTaskTitle] = useState("");
  const [teamTaskDescription, setTeamTaskDescription] = useState("");
  const [teamTaskPriority, setTeamTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [teamTaskAssignedTo, setTeamTaskAssignedTo] = useState("");
  const [teamTaskDueDate, setTeamTaskDueDate] = useState("");
  const [taskActionStatus, setTaskActionStatus] = useState("");
  const [chatText, setChatText] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [retainerName, setRetainerName] = useState("");
  const [retainerSignatureType, setRetainerSignatureType] = useState<"initials" | "signature" | "typed">("typed");
  const [retainerSignatureValue, setRetainerSignatureValue] = useState("");
  const [retainerStatus, setRetainerStatus] = useState("");
  const [commClientName, setCommClientName] = useState("");
  const [commFormType, setCommFormType] = useState("PGWP");
  const [commFormTypeOther, setCommFormTypeOther] = useState("");
  const [commPhone, setCommPhone] = useState("");
  const [commEmail, setCommEmail] = useState("");
  const [commTotalCharges, setCommTotalCharges] = useState("");
  const [commIrccFees, setCommIrccFees] = useState("");
  const [commIrccFeePayer, setCommIrccFeePayer] = useState<"sir_card" | "client_card">("client_card");
  const [commCreateStatus, setCommCreateStatus] = useState("");
  const [commUrgent, setCommUrgent] = useState(false);
  const [commUrgentDays, setCommUrgentDays] = useState("5");
  const [commSearch, setCommSearch] = useState("");
  const [commPaymentFilter, setCommPaymentFilter] = useState<"all" | "pending" | "paid">("all");
  const [commPaymentStatus, setCommPaymentStatus] = useState("");
  const [commPruneCaseIds, setCommPruneCaseIds] = useState("CASE-1006, CASE-1007");
  const [commPruneStatus, setCommPruneStatus] = useState("");
  const [caseActionStatus, setCaseActionStatus] = useState("");
  const [diagnosticsStatus, setDiagnosticsStatus] = useState("");
  const [diagnosticsReport, setDiagnosticsReport] = useState<DiagnosticsReport | null>(null);
  const [caseSearch, setCaseSearch] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState<"all" | "docs_pending" | "under_review" | "submitted" | "other">("all");
  const [caseAssignedFilter, setCaseAssignedFilter] = useState<string>("all");
  const [accountingSearch, setAccountingSearch] = useState("");
  const [accountingPaymentFilter, setAccountingPaymentFilter] = useState<"all" | "pending" | "paid">("all");
  const [accountingAmount, setAccountingAmount] = useState<Record<string, string>>({});
  const [accountingStatus, setAccountingStatus] = useState("");
  const [brandAppName, setBrandAppName] = useState("");
  const [brandLogoText, setBrandLogoText] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [brandDriveRootLink, setBrandDriveRootLink] = useState("");
  const [brandCustomSections, setBrandCustomSections] = useState<CustomPortalSection[]>([]);
  const [brandCustomSectionHistory, setBrandCustomSectionHistory] = useState<CustomPortalSectionVersion[]>([]);
  const [newCustomSectionTitle, setNewCustomSectionTitle] = useState("");
  const [newCustomSectionBody, setNewCustomSectionBody] = useState("");
  const [newCustomSectionFieldType, setNewCustomSectionFieldType] = useState<CustomPortalSection["fieldType"]>("text");
  const [newCustomSectionOptions, setNewCustomSectionOptions] = useState("");
  const [newCustomSectionVisibleFor, setNewCustomSectionVisibleFor] = useState("all");
  const [brandStatus, setBrandStatus] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamRole, setTeamRole] = useState<Role>("Processing");
  const [teamPassword, setTeamPassword] = useState("");
  const [teamDriveLink, setTeamDriveLink] = useState("");
  const [teamStatus, setTeamStatus] = useState("");
  const [teamPasswordDrafts, setTeamPasswordDrafts] = useState<Record<string, string>>({});
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
  const isUrgentCase = (c: CaseItem) => Boolean((c as CaseItem & { isUrgent?: boolean }).isUrgent);
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
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviteShareStatus, setInviteShareStatus] = useState("");
  const [paymentLinkStatus, setPaymentLinkStatus] = useState("");
  const [leadSheetCsvUrl, setLeadSheetCsvUrl] = useState(
    process.env.NEXT_PUBLIC_LEADS_SHEET_CSV_URL || ""
  );
  const [leadSyncStatus, setLeadSyncStatus] = useState("");
  const [clientPortalAccess, setClientPortalAccess] = useState(false);
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
      setBrandCustomSections(
        Array.isArray(comp?.branding?.customPortalSections)
          ? (comp.branding.customPortalSections as CustomPortalSection[])
          : []
      );
      setBrandCustomSectionHistory(
        Array.isArray(comp?.branding?.customPortalSectionHistory)
          ? (comp.branding.customPortalSectionHistory as CustomPortalSectionVersion[])
          : []
      );

      const caseRes = await apiFetch("/cases", { cache: "no-store" });
      if (!caseRes.ok) {
        setError("Could not load cases");
        return;
      }
      const casePayload = await caseRes.json();
      const loadedCases = casePayload.cases as CaseItem[];
      setCases(loadedCases);
      if (loadedCases.length > 0) {
        setSelectedCaseId((prev) =>
          prev && loadedCases.some((c) => c.id === prev) ? prev : ""
        );
      }

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

      if (user.userType === "staff") {
        const legacyRes = await apiFetch("/results/legacy", { cache: "no-store" });
        if (legacyRes.ok) {
          const legacyPayload = await legacyRes.json().catch(() => ({}));
          setLegacyResults((legacyPayload.items || []) as LegacyResultItem[]);
        }
        const usersRes = await apiFetch("/users", { cache: "no-store" });
        if (usersRes.ok) {
          const usersPayload = await usersRes.json().catch(() => ({}));
          setTeamUsers((usersPayload.users || []) as TeamUserItem[]);
        }
        if (user.role === "Admin") {
          const auditRes = await apiFetch("/audit?limit=100", { cache: "no-store" });
          if (auditRes.ok) {
            const auditPayload = await auditRes.json().catch(() => ({}));
            setAuditLogs((auditPayload.logs || []) as AuditItem[]);
          } else {
            setAuditStatus("Could not load audit logs.");
          }
        }
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
    if (!sessionUser || sessionUser.userType !== "staff") return;
    let cancelled = false;
    const tick = async () => {
      const res = await apiFetch("/notifications", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const payload = await res.json().catch(() => ({}));
      if (cancelled) return;
      setNotifications((payload.notifications || []) as NotificationItem[]);
    };
    const timer = setInterval(() => {
      void tick();
    }, 20000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sessionUser?.id, sessionUser?.userType]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token =
      new URLSearchParams(window.location.search).get("invite") ||
      new URLSearchParams(window.location.search).get("invite_token") ||
      new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    window.location.replace(`/invite/${encodeURIComponent(token)}`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setClientPortalAccess(params.get("client") === "1");
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
    const byStatus =
      caseStatusFilter === "all"
        ? byRole
        : byRole.filter((c) => (c.processingStatus || "docs_pending") === caseStatusFilter);
    if (!q) return byStatus;
    return byStatus.filter((c) => {
      const candidate = `${c.id} ${c.client} ${c.formType} ${c.assignedTo || ""} ${c.processingStatus || ""} ${c.processingStatusOther || ""}`.toLowerCase();
      return candidate.includes(q);
    });
  }, [cases, viewRole, caseSearch, caseStatusFilter]);
  const roleScopedCases = useMemo(() => filterCasesByRole(cases, viewRole), [cases, viewRole]);
  const caseSearchSuggestions = useMemo(() => {
    const q = caseSearch.trim().toLowerCase();
    if (!q) return [] as CaseItem[];
    const scored = roleScopedCases
      .filter((c) => {
        const candidate = `${c.id} ${c.client} ${c.formType} ${c.assignedTo || ""}`.toLowerCase();
        return candidate.includes(q);
      })
      .sort((a, b) => {
        const aNew = (a.caseStatus || "lead") === "lead" || (a.caseStatus || "lead") === "active";
        const bNew = (b.caseStatus || "lead") === "lead" || (b.caseStatus || "lead") === "active";
        if (aNew !== bNew) return aNew ? -1 : 1;
        const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTs - aTs;
      });
    return scored.slice(0, 50);
  }, [roleScopedCases, caseSearch]);
  const selectedCase = roleScopedCases.find((c) => c.id === selectedCaseId) ?? null;
  const clientRelatedCases = useMemo(() => {
    if (!selectedCase) return [] as CaseItem[];
    const scoped = cases.filter((c) => c.companyId === selectedCase.companyId);
    const byClientId = selectedCase.clientId
      ? scoped.filter((c) => c.clientId && c.clientId === selectedCase.clientId)
      : [];
    const byContact = scoped.filter((c) => {
      const sameEmail =
        String(selectedCase.leadEmail || "").trim().length > 0 &&
        String(c.leadEmail || "").trim().toLowerCase() === String(selectedCase.leadEmail || "").trim().toLowerCase();
      const samePhone =
        String(selectedCase.leadPhone || "").trim().length > 0 &&
        String(c.leadPhone || "").replace(/\s+/g, "") === String(selectedCase.leadPhone || "").replace(/\s+/g, "");
      const sameName =
        String(c.client || "").trim().toLowerCase() === String(selectedCase.client || "").trim().toLowerCase();
      return sameEmail || samePhone || sameName;
    });
    const dedup = new Map<string, CaseItem>();
    [...byClientId, ...byContact].forEach((c) => dedup.set(c.id, c));
    if (!dedup.has(selectedCase.id)) {
      dedup.set(selectedCase.id, selectedCase);
    }
    return Array.from(dedup.values()).sort((a, b) => {
      const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTs - aTs;
    });
  }, [cases, selectedCase]);
  const newCasesList = useMemo(
    () =>
      visibleCases.filter((c) => {
        const status = c.caseStatus || "lead";
        const isAssigned = String(c.assignedTo || "Unassigned") !== "Unassigned";
        return (status === "active" || status === "lead") && !isAssigned;
      }),
    [visibleCases]
  );
  const assignedCasesList = useMemo(
    () =>
      visibleCases.filter((c) => {
        const status = c.caseStatus || "lead";
        const isAssigned = String(c.assignedTo || "Unassigned") !== "Unassigned";
        return (status === "active" || status === "lead") && isAssigned;
      }),
    [visibleCases]
  );
  const underReviewCasesList = useMemo(
    () =>
      visibleCases.filter(
        (c) =>
          (c.caseStatus || "lead") === "under_review" ||
          c.processingStatus === "under_review" ||
          c.stage === "Under Review" ||
          (c.aiStatus || "idle") === "drafting"
      ),
    [visibleCases]
  );
  const activeCaseBoardList = useMemo(() => {
    if (caseBoardView === "new_cases") return newCasesList;
    if (caseBoardView === "assigned_cases") return assignedCasesList;
    if (caseBoardView === "under_review_cases") return underReviewCasesList;
    if (caseBoardView === "urgent_cases") return visibleCases.filter((c) => isUrgentCase(c));
    return visibleCases;
  }, [caseBoardView, newCasesList, assignedCasesList, underReviewCasesList, visibleCases]);
  const activeCaseBoardListFiltered = useMemo(() => {
    if (caseAssignedFilter === "all") return activeCaseBoardList;
    return activeCaseBoardList.filter((c) => String(c.assignedTo || "Unassigned") === caseAssignedFilter);
  }, [activeCaseBoardList, caseAssignedFilter]);
  const caseTasks = useMemo(
    () => (selectedCase ? tasks.filter((t) => t.caseId === selectedCase.id) : []),
    [tasks, selectedCase?.id]
  );
  const resultDocuments = useMemo(
    () =>
      documents
        .filter((d) => {
          if ((d.category || "general") === "result") return true;
          const name = String(d.name || "").toLowerCase();
          return (
            name.includes("result") ||
            name.includes("approval") ||
            name.includes("refusal") ||
            name.includes("decision") ||
            name.includes("request letter")
          );
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [documents]
  );
  const resultCaseOptions = useMemo(() => {
    const query = resultSearch.trim().toLowerCase();
    return visibleCases
      .filter((c) => {
        if (!query) return true;
        return `${c.id} ${c.client} ${c.formType}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTs - aTs;
      });
  }, [visibleCases, resultSearch]);
  const resultLinkedCase = useMemo(() => {
    const appNo = resultApplicationNumber.trim().toLowerCase();
    const caseNo = resultCaseNumberInput.trim().toLowerCase();
    if (!appNo && !caseNo) return null;
    const matches = visibleCases.filter((c) => {
      const byApp =
        appNo &&
        String(c.applicationNumber || "")
          .trim()
          .toLowerCase() === appNo &&
        ((c.processingStatus || "docs_pending") === "submitted" ||
          c.stage === "Submitted" ||
          c.stage === "Decision" ||
          Boolean(c.submittedAt));
      const byCase = caseNo ? String(c.id || "").trim().toLowerCase() === caseNo : false;
      return byApp || byCase;
    });
    if (matches.length === 1) return matches[0];
    return null;
  }, [visibleCases, resultApplicationNumber, resultCaseNumberInput]);
  const resultAutoCategory = useMemo(() => {
    if (!resultApplicationNumber.trim() && !resultCaseNumberInput.trim()) return "";
    return resultLinkedCase ? "new" : "old";
  }, [resultLinkedCase, resultApplicationNumber, resultCaseNumberInput]);
  const todayIsoDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysResults = useMemo(
    () =>
      legacyResults.filter((r) => String(r.resultDate || "").slice(0, 10) === todayIsoDate),
    [legacyResults, todayIsoDate]
  );
  const notInformedResults = useMemo(
    () => legacyResults.filter((r) => !r.informedToClient),
    [legacyResults]
  );
  const submissionCaseOptions = useMemo(() => {
    const query = submissionSearch.trim().toLowerCase();
    return visibleCases
      .filter((c) => (c.processingStatus || "docs_pending") !== "submitted")
      .filter((c) => {
        if (!query) return true;
        return `${c.id} ${c.client} ${c.formType} ${c.applicationNumber || ""}`.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTs - aTs;
      });
  }, [visibleCases, submissionSearch]);
  const communicationSearchList = useMemo(() => {
    const query = commSearch.trim().toLowerCase();
    const byPayment =
      commPaymentFilter === "all"
        ? visibleCases
        : visibleCases.filter((c) => {
            const total = Number(c.servicePackage?.retainerAmount || 0);
            const paid = Number(c.amountPaid || 0);
            const status = paid >= total && total > 0 ? "paid" : c.paymentStatus || "pending";
            return status === commPaymentFilter;
          });
    if (!query) return byPayment.slice(0, 8);
    return byPayment
      .filter((c) => {
        const client = c.client.toLowerCase();
        const formType = (c.formType || "").toLowerCase();
        const caseId = c.id.toLowerCase();
        return client.includes(query) || formType.includes(query) || caseId.includes(query);
      })
      .slice(0, 8);
  }, [commSearch, visibleCases, commPaymentFilter]);
  const allowedTabs = useMemo(
    () => (sessionUser?.userType === "staff" ? tabsForRole(sessionUser.role) : []),
    [sessionUser?.role, sessionUser?.userType]
  );
  const visibleTabs = useMemo(() => tabs.filter((t) => allowedTabs.includes(t.id)), [allowedTabs]);
  const taskAssigneeOptions = useMemo(() => {
    const names = new Set<string>();
    teamUsers
      .filter((u) => u.active !== false)
      .forEach((u) => names.add(String(u.name || "").trim()));
    if (sessionUser?.name) names.add(sessionUser.name);
    if (selectedCase?.assignedTo) names.add(String(selectedCase.assignedTo));
    names.delete("");
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [teamUsers, sessionUser?.name, selectedCase?.assignedTo]);

  useEffect(() => {
    if (!visibleTabs.length) return;
    if (!visibleTabs.some((t) => t.id === screen)) {
      setScreen(visibleTabs[0].id);
    }
  }, [screen, visibleTabs]);

  async function loadCaseDetail(caseId: string) {
    const [msgRes, docRes, reqRes, outRes] = await Promise.all([
      apiFetch(`/cases/${caseId}/messages`, { cache: "no-store" }),
      apiFetch(`/cases/${caseId}/documents`, { cache: "no-store" }),
      apiFetch(`/cases/${caseId}/doc-requests`, { cache: "no-store" }),
      apiFetch(`/cases/${caseId}/outbound`, { cache: "no-store" })
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
    if (outRes.ok) {
      const payload = await outRes.json();
      setOutboundMessages((payload.logs || []) as OutboundMessageItem[]);
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
    const formType = String(payload.formType || intake.applicationType || "");
    setClientIntakeDone(isQuestionnaireComplete(formType, intake));
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
    setInviteUrl(clientAccessLinkFromPayload(payload));
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
    setInviteEmail(String(selectedCase.leadEmail || ""));
    setInvitePhone(String(selectedCase.leadPhone || ""));
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
    setResultOutcome((selectedCase.finalOutcome as "" | "approved" | "refused" | "request_letter") || "");
    setResultDecisionDate(selectedCase.decisionDate || "");
    setResultRemarks(selectedCase.remarks || "");
    setResultDecisionStatus("");
    setResultShareStatus("");
    setResultSendEmail(String(selectedCase.leadEmail || ""));
    setResultSendPhone(String(selectedCase.leadPhone || ""));
    setSubmissionApplicationNumber(selectedCase.applicationNumber || "");
    setSubmissionStatus("");
    setNewTaskAssignedTo(String(selectedCase.assignedTo || sessionUser?.name || ""));
    setNewTaskDueDate("");
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
    // Auto-guide the client once retainer is signed.
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

  useEffect(() => {
    if (!sessionUser) return;
    const minutes = Math.max(
      5,
      Number(process.env.NEXT_PUBLIC_INACTIVITY_LOGOUT_MINUTES || 30)
    );
    const timeoutMs = minutes * 60 * 1000;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void logout();
      }, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart"
    ];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [sessionUser?.id]);

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setSessionUser(null);
    setCompany(null);
    setCases([]);
  }

  async function createCaseFromCommunications() {
    const effectiveFormType =
      commFormType === "Other" ? commFormTypeOther.trim() : commFormType.trim();
    if (!commClientName.trim() || !effectiveFormType) {
      setCommCreateStatus("Client name and application type are required.");
      return;
    }
    const totalChargesRaw = commTotalCharges.trim();
    const irccFeesRaw = commIrccFees.trim();
    const totalCharges = totalChargesRaw ? Number(totalChargesRaw) : 0;
    const irccFees = irccFeesRaw ? Number(irccFeesRaw) : 0;
    if (!Number.isFinite(totalCharges) || totalCharges < 0) {
      setCommCreateStatus("Enter a valid Total Charges amount.");
      return;
    }
    if (!Number.isFinite(irccFees) || irccFees < 0) {
      setCommCreateStatus("Enter a valid IRCC Fees amount.");
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
        formType: effectiveFormType,
        leadPhone: commPhone.trim() || undefined,
        leadEmail: commEmail.trim() || undefined,
        totalCharges,
        irccFees,
        irccFeePayer: commIrccFeePayer,
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
    setInviteEmail(String(created.leadEmail || ""));
    setInvitePhone(String(created.leadPhone || ""));
    setSetupFormType(created.formType || effectiveFormType);
    const driveLinked = Boolean(payload?.drive?.linked);
    const driveReason = String(payload?.drive?.reason || "");
    if (driveLinked) {
      setCommCreateStatus(`Case created: ${created.id}. Drive folder linked. Now create invite link below.`);
    } else {
      setCommCreateStatus(
        `Case created: ${created.id}. Drive link pending (${driveReason || "not configured"}). Please check Company Branding Drive root.`
      );
    }
    setCommClientName("");
    setCommPhone("");
    setCommEmail("");
    setCommTotalCharges("");
    setCommIrccFees("");
    setCommIrccFeePayer("client_card");
    setCommFormTypeOther("");
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

  async function runDiagnosticsBot() {
    setDiagnosticsStatus("Running QA/Security bot checks...");
    const res = await apiFetch("/testing/bot", { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDiagnosticsReport(null);
      setDiagnosticsStatus(String(payload.error || "Could not run diagnostics bot."));
      return;
    }
    setDiagnosticsReport(payload as DiagnosticsReport);
    setDiagnosticsStatus("Diagnostics completed.");
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

  async function uploadResultDocument() {
    const targetCase = resultLinkedCase || selectedCase;
    if (!targetCase) {
      setResultUploadStatus("Enter application number/case ID or select a case first.");
      return;
    }
    if (!resultUploadFile) {
      setResultUploadStatus("Choose a file first.");
      return;
    }
    setResultUploadStatus("Uploading result...");
    const formData = new FormData();
    formData.append("file", resultUploadFile);
    formData.append("name", resultUploadName.trim() || resultUploadFile.name);
    formData.append("category", "result");
    const res = await apiFetch(`/cases/${targetCase.id}/documents`, {
      method: "POST",
      body: formData
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResultUploadStatus(String(payload.error || "Could not upload result."));
      return;
    }
    if (payload.document) {
      setDocuments((prev) => [...prev, payload.document as DocumentItem]);
    }
    setSelectedCaseId(targetCase.id);
    await loadCaseDetail(targetCase.id);
    setResultUploadFile(null);
    setResultUploadName("");
    setResultUploadStatus(`Result uploaded for ${targetCase.id} and available in client portal.`);
  }

  async function saveCaseResultDecision() {
    const targetCase = resultLinkedCase || selectedCase;
    if (!targetCase) {
      setResultDecisionStatus("Enter application number/case ID or select a case first.");
      return;
    }
    if (!resultOutcome) {
      setResultDecisionStatus("Select a decision first.");
      return;
    }
    setResultDecisionStatus("Saving decision...");
    const res = await apiFetch(`/cases/${targetCase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        finalOutcome: resultOutcome,
        decisionDate: resultDecisionDate.trim() || undefined,
        remarks: resultRemarks.trim() || undefined
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setResultDecisionStatus(String(payload.error || "Could not save result decision."));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCaseId(updated.id);
    setResultDecisionStatus(`Saved result for ${updated.id}.`);
  }

  function buildResultMessage(caseItem: CaseItem) {
    const outcome =
      caseItem.finalOutcome === "approved"
        ? "approved"
        : caseItem.finalOutcome === "refused"
          ? "refused"
          : caseItem.finalOutcome === "request_letter"
            ? "request letter issued"
            : "updated";
    const resultLink = resultDocuments[0]?.link || "";
    const lines = [
      `Hi ${caseItem.client},`,
      "",
      `Your case ${caseItem.id} (${caseItem.formType}) is ${outcome}.`
    ];
    if (caseItem.applicationNumber) {
      lines.push(`Application number: ${caseItem.applicationNumber}`);
    }
    if (resultLink) {
      lines.push("", `Result document: ${resultLink}`);
    }
    if (caseItem.finalOutcome === "approved") {
      lines.push("", "Congratulations, we got your permit approved.");
      lines.push("If you found our service helpful, please share your review:");
      lines.push("https://g.page/r/CYTdpFJ-nDr7EAE/review");
    }
    lines.push("", "Newton Immigration Team");
    return lines.join("\n");
  }

  async function sendResultUpdate(channel: "email" | "whatsapp" | "sms") {
    const targetCase = resultLinkedCase || selectedCase;
    if (!targetCase) {
      setResultShareStatus("Enter application number/case ID or select a case first.");
      return;
    }
    setResultShareStatus("Sending result update...");
    const message = buildResultMessage(targetCase);
    const email = resultSendEmail.trim() || String(targetCase.leadEmail || "").trim();
    const phone = resultSendPhone.trim() || String(targetCase.leadPhone || "").trim();

    if (channel === "email") {
      if (!email) {
        setResultShareStatus("Enter client email first.");
        return;
      }
      const dispatchStatus = await tryServerDispatch("email", email, message);
      if (dispatchStatus === "sent") {
        setResultShareStatus("Result email sent.");
        return;
      }
      setResultShareStatus("Email provider not configured. Opened local email app.");
      window.open(
        `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Case result update - ${targetCase.id}`)}&body=${encodeURIComponent(message)}`,
        "_blank"
      );
      return;
    }

    const cleanedPhone = channel === "whatsapp" ? normalizePhoneForWa(phone) : phone.replace(/[^\d+]/g, "");
    if (!cleanedPhone) {
      setResultShareStatus("Enter client phone number first.");
      return;
    }
    const dispatchStatus = await tryServerDispatch(channel, cleanedPhone, message);
    if (dispatchStatus === "sent") {
      setResultShareStatus(channel === "whatsapp" ? "Result WhatsApp sent." : "Result SMS sent.");
      return;
    }
    if (channel === "whatsapp") {
      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`, "_blank");
      setResultShareStatus("WhatsApp opened. Provider not configured for server send.");
    } else {
      window.open(`sms:${cleanedPhone}?body=${encodeURIComponent(message)}`, "_blank");
      setResultShareStatus("SMS app opened. Provider not configured for server send.");
    }
  }

  async function submitLegacyResult() {
    const appNo = resultApplicationNumber.trim();
    if (!appNo) {
      setLegacyResultStatus("Application number is required.");
      return;
    }
    const client = legacyResultClientName.trim() || "Legacy Client";
    setLegacyResultStatus("Saving legacy result...");
    const form = new FormData();
    form.append("applicationNumber", appNo);
    form.append("resultDate", legacyResultDate || todayIsoDate);
    form.append("clientName", client);
    form.append("phone", legacyResultPhone.trim());
    form.append("outcome", legacyResultOutcome);
    form.append("notes", legacyResultNotes.trim());
    if (legacyResultFile) form.append("file", legacyResultFile);

    const res = await apiFetch("/results/legacy", {
      method: "POST",
      body: form
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLegacyResultStatus(String(payload.error || "Could not save legacy result."));
      return;
    }
    const item = payload.item as LegacyResultItem;
    setLegacyResults((prev) => [item, ...prev]);
    setLegacyResultFile(null);
    setLegacyResultNotes("");
    setLegacyResultStatus(
      item.autoCategory === "new"
        ? `Saved and linked to ${item.matchedCaseId || "case"} automatically.`
        : `Saved old-client result for ${item.clientName}.`
    );
  }

  async function markResultInformed(resultId: string) {
    setLegacyResultStatus("Updating informed status...");
    const res = await apiFetch("/results/legacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLegacyResultStatus(String(payload.error || "Could not update informed status."));
      return;
    }
    const updated = payload.item as LegacyResultItem;
    setLegacyResults((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setLegacyResultStatus("Marked as sent to client.");
  }

  async function submitCaseWithApplicationNumber() {
    if (!selectedCase) return;
    const appNo = submissionApplicationNumber.trim();
    if (!appNo) {
      setSubmissionStatus("Application number is required.");
      return;
    }
    setSubmissionStatus("Submitting case...");
    const res = await apiFetch(`/cases/${selectedCase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        processingStatus: "submitted",
        applicationNumber: appNo,
        submittedAt: new Date().toISOString()
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSubmissionStatus(String(payload.error || "Could not submit case."));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSubmissionStatus(`Submitted ${updated.id} with application number ${appNo}.`);
    setSubmissionApplicationNumber("");
  }

  async function uploadSubmissionDocument() {
    if (!selectedCase) {
      setSubmissionUploadStatus("Select a case first.");
      return;
    }
    if (!submissionUploadFile) {
      setSubmissionUploadStatus("Choose a file first.");
      return;
    }
    setSubmissionUploadStatus("Uploading to submission folder...");
    const formData = new FormData();
    formData.append("file", submissionUploadFile);
    formData.append(
      "name",
      submissionUploadType === "submission_letter" ? "Submission Letter" : "WP Extension Letter"
    );
    formData.append("driveFolderType", "submission");
    formData.append("category", "general");
    const res = await apiFetch(`/cases/${selectedCase.id}/documents`, {
      method: "POST",
      body: formData
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSubmissionUploadStatus(String(payload.error || "Could not upload submission document."));
      return;
    }
    if (payload.document) {
      setDocuments((prev) => [...prev, payload.document as DocumentItem]);
    }
    setSubmissionUploadFile(null);
    setSubmissionUploadStatus("Uploaded successfully to submission folder.");
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
    setInviteShareStatus("");
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
    const url = clientAccessLinkFromPayload(payload);
    setInviteUrl(url);
    setInviteStatus("Invite link ready. Send this to client.");
    await logOutboundCommunication({
      channel: "link",
      status: "sent",
      target: inviteEmail.trim() || invitePhone.trim() || undefined,
      message: `Client portal link generated: ${url}`
    });
  }

  async function logOutboundCommunication(input: {
    channel: "email" | "whatsapp" | "sms" | "link" | "copy";
    status: "queued" | "opened_app" | "sent" | "failed";
    target?: string;
    message: string;
  }) {
    if (!selectedCase) return;
    const res = await apiFetch(`/cases/${selectedCase.id}/outbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    if (!res.ok) return;
    const payload = await res.json().catch(() => ({}));
    const log = payload?.log as OutboundMessageItem | undefined;
    if (log) {
      setOutboundMessages((prev) => [log, ...prev]);
    }
  }

  async function tryServerDispatch(
    channel: "email" | "whatsapp" | "sms",
    target: string,
    message: string
  ): Promise<"sent" | "provider_missing" | "failed" | "not_applicable"> {
    if (!selectedCase) return "not_applicable";
    const trimmedTarget = String(target || "").trim();
    if (!trimmedTarget) return "failed";
    const res = await apiFetch(`/cases/${selectedCase.id}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        target: trimmedTarget,
        message
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return "failed";
    const status = String(payload?.result?.status || "");
    const log = payload?.log as OutboundMessageItem | undefined;
    if (log) setOutboundMessages((prev) => [log, ...prev]);
    if (status === "sent") return "sent";
    if (status === "provider_missing") return "provider_missing";
    return "failed";
  }

  function normalizePhoneForWa(phone: string) {
    const digits = phone.replace(/[^\d]/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `1${digits}`;
    return digits;
  }

  function buildInviteMessage(caseItem: CaseItem, url: string) {
    const amount = Number(setupRetainerAmount || caseItem.servicePackage.retainerAmount || 0);
    return [
      `Hi ${caseItem.client},`,
      "",
      `Your Newton Immigration portal link is ready for ${caseItem.formType}.`,
      `Case: ${caseItem.id}`,
      "",
      `Complete your details and documents here:`,
      url,
      "",
      amount > 0
        ? `Interac amount: $${amount} CAD to ${fixedInteracRecipient} (use case number ${caseItem.id} in message).`
        : `Please follow instructions inside your portal.`,
      "",
      "Newton Immigration Team"
    ].join("\n");
  }

  async function shareInvite(channel: "copy" | "email" | "whatsapp" | "sms") {
    const caseItem = selectedCase;
    if (!caseItem || !inviteUrl) {
      setInviteShareStatus("Create invite link first.");
      return;
    }
    const message = buildInviteMessage(caseItem, inviteUrl);
    const email = inviteEmail.trim() || String(caseItem.leadEmail || "").trim();
    const phone = invitePhone.trim() || String(caseItem.leadPhone || "").trim();

    try {
      if (channel === "copy") {
        await navigator.clipboard.writeText(message);
        setInviteShareStatus("Invite message copied.");
        await logOutboundCommunication({
          channel: "copy",
          status: "sent",
          target: undefined,
          message
        });
        return;
      }
      if (channel === "email") {
        if (!email) {
          setInviteShareStatus("Enter client email first.");
          return;
        }
        const dispatchStatus = await tryServerDispatch("email", email, message);
        if (dispatchStatus === "sent") {
          setInviteShareStatus("Email sent from server.");
          return;
        }
        const subject = encodeURIComponent(`Newton Immigration Portal Link - ${caseItem.id}`);
        const body = encodeURIComponent(message);
        window.open(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`, "_blank");
        setInviteShareStatus(
          dispatchStatus === "provider_missing"
            ? "Email provider not configured yet. Email app opened instead."
            : "Email app opened."
        );
        await logOutboundCommunication({
          channel: "email",
          status: "opened_app",
          target: email,
          message
        });
        return;
      }
      if (channel === "whatsapp") {
        const waPhone = normalizePhoneForWa(phone);
        if (!waPhone) {
          setInviteShareStatus("Enter client phone number first.");
          return;
        }
        const dispatchStatus = await tryServerDispatch("whatsapp", waPhone, message);
        if (dispatchStatus === "sent") {
          setInviteShareStatus("WhatsApp sent from server.");
          return;
        }
        const text = encodeURIComponent(message);
        window.open(`https://wa.me/${waPhone}?text=${text}`, "_blank");
        setInviteShareStatus(
          dispatchStatus === "provider_missing"
            ? "WhatsApp provider not configured yet. WhatsApp app opened instead."
            : "WhatsApp opened."
        );
        await logOutboundCommunication({
          channel: "whatsapp",
          status: "opened_app",
          target: waPhone,
          message
        });
        return;
      }
      if (channel === "sms") {
        const smsPhone = phone.replace(/[^\d+]/g, "");
        if (!smsPhone) {
          setInviteShareStatus("Enter client phone number first.");
          return;
        }
        const dispatchStatus = await tryServerDispatch("sms", smsPhone, message);
        if (dispatchStatus === "sent") {
          setInviteShareStatus("SMS sent from server.");
          return;
        }
        const body = encodeURIComponent(message);
        window.open(`sms:${smsPhone}?body=${body}`, "_blank");
        setInviteShareStatus(
          dispatchStatus === "provider_missing"
            ? "SMS provider not configured yet. SMS app opened instead."
            : "SMS app opened."
        );
        await logOutboundCommunication({
          channel: "sms",
          status: "opened_app",
          target: smsPhone,
          message
        });
      }
    } catch {
      setInviteShareStatus("Could not open sharing app.");
      await logOutboundCommunication({
        channel,
        status: "failed",
        target: channel === "email" ? email : phone,
        message
      });
    }
  }

  async function sendPaymentLinkForCase(caseInput?: CaseItem) {
    const caseItem = caseInput ?? selectedCase;
    if (!caseItem) return;
    setPaymentLinkStatus("Preparing payment link...");
    setInviteShareStatus("");

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

    const url = clientAccessLinkFromPayload(invitePayload);
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
    type: "documents" | "tasks" | "communication" | "open";
  } {
    if ((caseItem.paymentStatus || "pending") === "pending") {
      return { label: "Pending Payment", hint: "Handle in Communications", type: "communication" };
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

  async function updateCaseProcessing(
    caseId: string,
    patch: Partial<
      Pick<
        CaseItem,
        | "assignedTo"
        | "processingStatus"
        | "processingStatusOther"
        | "paymentMethod"
        | "applicationNumber"
        | "submittedAt"
        | "finalOutcome"
        | "decisionDate"
        | "remarks"
      >
    >
  ) {
    setCaseActionStatus("Saving case updates...");
    const res = await apiFetch(`/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCaseActionStatus(String(payload.error || "Could not save case updates."));
      return;
    }
    const updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setCaseActionStatus(`Updated ${updated.id}.`);
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
    const generatedInviteUrl = clientAccessLinkFromPayload(invitePayload);
    if (inviteRes.ok && generatedInviteUrl) {
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
    const raw = String(accountingAmount[caseId] || "").trim();
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const amount = Number(cleaned || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAccountingStatus("Enter a valid paid amount.");
      return;
    }
    setAccountingStatus("Recording received amount...");
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
    let updated = payload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setAccountingAmount((prev) => ({ ...prev, [caseId]: "" }));
    const total = Number(updated.servicePackage?.retainerAmount || updated.totalCharges || 0);
    const paid = Number((updated as CaseItem & { amountPaid?: number }).amountPaid || 0);
    const remaining = Math.max(0, total - paid);

    if (remaining > 0) {
      setAccountingStatus(
        `Amount recorded for ${updated.id}. Remaining $${remaining}. Payment stays pending until full amount is received.`
      );
      return;
    }

    setAccountingStatus("Amount recorded. Confirming full payment...");
    const confirmRes = await apiFetch(`/cases/${caseId}/retainer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" })
    });
    const confirmPayload = await confirmRes.json().catch(() => ({}));
    if (!confirmRes.ok) {
      setAccountingStatus(
        `Amount recorded for ${updated.id}, but could not mark paid: ${String(
          confirmPayload.error || "unknown error"
        )}`
      );
      return;
    }
    updated = confirmPayload.case as CaseItem;
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setAccountingStatus(`Payment confirmed for ${updated.id}.`);
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
        driveRootLink: brandDriveRootLink.trim(),
        customPortalSections: brandCustomSections
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBrandStatus(String(payload.error || "Could not save branding"));
      return;
    }
    const nextCompany = payload.company as Company;
    setCompany(nextCompany);
    setBrandCustomSections(
      Array.isArray(nextCompany?.branding?.customPortalSections)
        ? (nextCompany.branding.customPortalSections as CustomPortalSection[])
        : []
    );
    setBrandCustomSectionHistory(
      Array.isArray(nextCompany?.branding?.customPortalSectionHistory)
        ? (nextCompany.branding.customPortalSectionHistory as CustomPortalSectionVersion[])
        : []
    );
    setBrandStatus("Branding updated.");
  }

  function addCustomPortalSection() {
    const title = newCustomSectionTitle.trim();
    const body = newCustomSectionBody.trim();
    if (!title || !body) {
      setBrandStatus("Custom section title and body are required.");
      return;
    }
    const options = newCustomSectionOptions
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const visibleFor = newCustomSectionVisibleFor === "all" ? ["all"] : [newCustomSectionVisibleFor];
    setBrandCustomSections((prev) => [
      ...prev,
      {
        id: `section_${Date.now()}`,
        title,
        body,
        fieldType: newCustomSectionFieldType || "text",
        options,
        visibleFor,
        sortOrder: prev.length + 1,
        enabled: true
      }
    ]);
    setNewCustomSectionTitle("");
    setNewCustomSectionBody("");
    setNewCustomSectionFieldType("text");
    setNewCustomSectionOptions("");
    setNewCustomSectionVisibleFor("all");
    setBrandStatus("Custom section added. Click Save Branding to publish.");
  }

  function updateCustomPortalSection(index: number, patch: Partial<CustomPortalSection>) {
    setBrandCustomSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, ...patch } : section))
    );
  }

  function removeCustomPortalSection(index: number) {
    setBrandCustomSections((prev) => prev.filter((_, i) => i !== index));
    setBrandStatus("Custom section removed. Click Save Branding to publish.");
  }

  function moveCustomPortalSection(index: number, direction: -1 | 1) {
    setBrandCustomSections((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const current = next[index];
      next[index] = next[target];
      next[target] = current;
      return next.map((section, i) => ({ ...section, sortOrder: i + 1 }));
    });
    setBrandStatus("Section order updated. Click Save Branding to publish.");
  }

  async function rollbackCustomPortalSections(versionId: string) {
    if (!versionId) return;
    setBrandStatus("Restoring portal version...");
    const res = await apiFetch("/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollbackPortalVersionId: versionId })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBrandStatus(String(payload.error || "Could not rollback portal version."));
      return;
    }
    const nextCompany = payload.company as Company;
    setCompany(nextCompany);
    setBrandCustomSections(
      Array.isArray(nextCompany?.branding?.customPortalSections)
        ? (nextCompany.branding.customPortalSections as CustomPortalSection[])
        : []
    );
    setBrandCustomSectionHistory(
      Array.isArray(nextCompany?.branding?.customPortalSectionHistory)
        ? (nextCompany.branding.customPortalSectionHistory as CustomPortalSectionVersion[])
        : []
    );
    setBrandStatus("Portal sections restored.");
  }

  async function addTeamMember() {
    if (!teamName.trim() || !teamEmail.trim() || !teamPassword.trim()) {
      setTeamStatus("Name, email and temporary password are required.");
      return;
    }
    setTeamStatus("Adding team member...");
    const res = await apiFetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: teamName.trim(),
        email: teamEmail.trim(),
        role: teamRole,
        password: teamPassword.trim(),
        workspaceDriveLink: teamDriveLink.trim()
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTeamStatus(String(payload.error || "Could not add team member."));
      return;
    }
    setTeamStatus(`Team member added: ${String(payload?.user?.name || teamName.trim())}`);
    setTeamName("");
    setTeamEmail("");
    setTeamPassword("");
    setTeamDriveLink("");
    const usersRes = await apiFetch("/users", { cache: "no-store" });
    if (usersRes.ok) {
      const usersPayload = await usersRes.json().catch(() => ({}));
      setTeamUsers((usersPayload.users || []) as TeamUserItem[]);
    }
  }

  async function syncNewtonTeamPreset() {
    setTeamStatus("Syncing Newton team users...");
    const res = await apiFetch("/users/sync-newton", { method: "POST" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTeamStatus(String(payload.error || "Could not sync team preset."));
      return;
    }
    setTeamStatus(`Team preset synced. Created ${Number(payload.created || 0)}, updated ${Number(payload.updated || 0)}.`);
    const usersRes = await apiFetch("/users", { cache: "no-store" });
    if (usersRes.ok) {
      const usersPayload = await usersRes.json().catch(() => ({}));
      setTeamUsers((usersPayload.users || []) as TeamUserItem[]);
    }
  }

  async function setTeamMemberActive(userId: string, active: boolean) {
    setTeamStatus(active ? "Reactivating team member..." : "Deactivating team member...");
    const res = await apiFetch(`/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTeamStatus(String(payload.error || "Could not update member status."));
      return;
    }
    const updated = payload.user as TeamUserItem;
    setTeamUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, active: updated.active } : u)));
    setTeamStatus(`${updated.name} is now ${updated.active === false ? "inactive" : "active"}.`);
  }

  async function resetTeamMemberPassword(userId: string) {
    const nextPassword = String(teamPasswordDrafts[userId] || "").trim();
    if (!nextPassword) {
      setTeamStatus("Enter a new password before reset.");
      return;
    }
    setTeamStatus("Resetting password...");
    const res = await apiFetch(`/users/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nextPassword })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTeamStatus(String(payload.error || "Could not reset password."));
      return;
    }
    setTeamPasswordDrafts((prev) => ({ ...prev, [userId]: "" }));
    setTeamStatus("Password reset complete.");
  }

  async function resetTeamMemberMfa(userId: string) {
    setTeamStatus("Resetting MFA...");
    const res = await apiFetch(`/users/${userId}/mfa/reset`, {
      method: "POST"
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTeamStatus(String(payload.error || "Could not reset MFA."));
      return;
    }
    const updated = payload.user as TeamUserItem;
    setTeamUsers((prev) =>
      prev.map((u) =>
        u.id === updated.id
          ? {
              ...u,
              active: updated.active,
              mfaEnabled: updated.mfaEnabled
            }
          : u
      )
    );
    setTeamStatus(`MFA reset complete for ${updated.name}.`);
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
        priority: newTaskPriority,
        assignedTo: newTaskAssignedTo.trim() || selectedCase.assignedTo || sessionUser?.name || "Unassigned",
        dueDate: newTaskDueDate || undefined
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
    setNewTaskDueDate("");
    setTaskActionStatus("Task created.");
    await refreshTasks(selectedCase.id);
  }

  async function createTeamTask() {
    if (!teamTaskCaseId.trim()) {
      setTaskActionStatus("Select case first.");
      return;
    }
    if (!teamTaskTitle.trim()) {
      setTaskActionStatus("Task title is required.");
      return;
    }
    setTaskActionStatus("Creating team task...");
    const targetCase = visibleCases.find((c) => c.id === teamTaskCaseId) || selectedCase;
    const res = await apiFetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: teamTaskCaseId,
        title: teamTaskTitle.trim(),
        description: teamTaskDescription.trim(),
        priority: teamTaskPriority,
        assignedTo: teamTaskAssignedTo.trim() || targetCase?.assignedTo || sessionUser?.name || "Unassigned",
        dueDate: teamTaskDueDate || undefined
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setTaskActionStatus(String(payload.error || "Could not create task"));
      return;
    }
    setTeamTaskTitle("");
    setTeamTaskDescription("");
    setTeamTaskPriority("medium");
    setTeamTaskDueDate("");
    setTaskActionStatus("Team task created.");
    await refreshTasks();
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
    const res = await apiFetch(`/cases/${caseId}/retainer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signerName: sessionUser?.name || "Client",
        signatureType: "typed",
        signatureValue: "I AGREE",
        acceptedTerms: true
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
    setClientScreen("overview");
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
    if (payload?.driveUpload?.success) {
      setClientUploadStatus("Upload complete (saved to Google Drive).");
    } else {
      setClientUploadStatus("Upload complete (saved locally). Ask team to check Google Drive integration.");
    }
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
    const uploadedToDrive = Boolean(payload?.driveUpload?.success);
    setChecklistStatus((prev) => ({
      ...prev,
      [item.key]: uploadedToDrive ? "Uploaded to Google Drive." : "Uploaded locally (Drive not linked)."
    }));
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
    if (!clientPortalAccess) {
      return (
        <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
          <Header {...headerProps} />
          <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
            <h2 className="text-lg font-semibold text-amber-900">Open Client Portal from Secure Link</h2>
            <p className="mt-1 text-sm text-amber-900">
              This URL is for staff workspace. Please open the secure client invite link sent by Newton Immigration.
            </p>
            <button
              onClick={() => void logout()}
              className="mt-3 rounded-lg border border-amber-700 bg-white px-3 py-2 text-sm font-semibold text-amber-900"
            >
              Sign Out
            </button>
          </section>
        </main>
      );
    }
    const c = cases[0];
    const companyName = company?.name || "Your Company";
    const caseChecklist: RequiredDocItem[] = c ? getChecklistForFormType(c.formType) : [];
    const clientReadyForDocs = Boolean(c && c.retainerSigned);
    const docsChecklistComplete = (() => {
      if (!c) return false;
      const requiredItems = caseChecklist.filter((item) => item.required !== false);
      if (requiredItems.length === 0) return documents.length > 0;
      return requiredItems.every((item) => isChecklistDocUploaded(item));
    })();
    const openDocRequests = (docRequests || []).filter((r) => r.status === "open");
    const processingSupportPhone = "6049024500";
    const currentCaseKey = resolveApplicationChecklistKey(c?.formType || "generic");
    const clientCustomSections = Array.isArray(company?.branding?.customPortalSections)
      ? (company?.branding?.customPortalSections as CustomPortalSection[])
          .filter((section) => {
            if (!section || section.enabled === false || !section.title || !section.body) return false;
            const visibleFor = Array.isArray(section.visibleFor) ? section.visibleFor : ["all"];
            if (visibleFor.includes("all")) return true;
            return visibleFor.includes(currentCaseKey);
          })
          .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      : [];
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
                <button onClick={() => setClientScreen("results")} className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold ${clientScreen === "results" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Results</button>
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
              <div className="mt-2 grid gap-2 md:grid-cols-2 text-sm">
                <article className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs text-slate-500">Case</p>
                  <p className="font-semibold">{c.id}</p>
                </article>
                <article className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs text-slate-500">Application</p>
                  <p className="font-semibold">{c.formType}</p>
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
                    Retainer auto-enabled for this secure invite.
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
                ) : (
                  <div className="mt-3 grid gap-2">
                    <button onClick={() => void signRetainer(c.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">I Agree and Continue</button>
                    {retainerStatus ? <p className="text-xs text-slate-600">{retainerStatus}</p> : null}
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
                {!clientReadyForDocs ? <p className="mt-2 text-xs text-amber-700">Complete retainer e-sign to unlock actions.</p> : null}
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
            {clientCustomSections.map((section) => (
              <section key={section.id} className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{section.title}</h3>
                  <span className="rounded border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                    {section.fieldType || "text"}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{section.body}</p>
                {section.fieldType === "dropdown" && Array.isArray(section.options) && section.options.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                    {section.options.map((option) => (
                      <li key={`${section.id}-${option}`}>{option}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
            <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
              <h3 className="font-semibold">Contact Us</h3>
              <p className="mt-1 text-sm text-slate-700">
                For case processing call at <span className="font-semibold">{processingSupportPhone}</span>.
              </p>
            </section>
            <a
              href="https://www.franco.app"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 shadow-sm"
            >
              <p className="text-base font-semibold text-blue-900">
                Want to learn French for your immigration journey?
              </p>
              <p className="mt-1 text-sm text-blue-800">
                Visit franco.app for structured French practice and support.
              </p>
            </a>
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
            <button onClick={logout} className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold">
              <LogOut size={14} className="inline mr-1" /> Logout
            </button>
          </div>
        </div>
      </section>

      {error ? <section className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</section> : null}

      <section className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
        <aside className="rounded-2xl border-2 border-slate-300 bg-white p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {company ? `${company.name} Workspace` : "Company Workspace"}
          </p>
          <div className="space-y-1">
            {visibleTabs.map((tab) => (
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
                    {visibleCases.filter((c) => isUrgentCase(c)).length}
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

              <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                <h3 className="text-base font-semibold">Customize Client Portal</h3>
                <p className="mt-1 text-xs text-slate-500">Add/edit/remove custom sections shown automatically in client portal.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <input
                    value={newCustomSectionTitle}
                    onChange={(e) => setNewCustomSectionTitle(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                    placeholder="Section title"
                  />
                  <select
                    value={newCustomSectionFieldType}
                    onChange={(e) => setNewCustomSectionFieldType(e.target.value as CustomPortalSection["fieldType"])}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                  >
                    {PORTAL_FIELD_TYPES.map((type) => (
                      <option key={`new-ft-${type}`} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={newCustomSectionVisibleFor}
                    onChange={(e) => setNewCustomSectionVisibleFor(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                  >
                    {PORTAL_VISIBILITY_OPTIONS.map((item) => (
                      <option key={`new-vis-${item}`} value={item}>{item}</option>
                    ))}
                  </select>
                  <input
                    value={newCustomSectionBody}
                    onChange={(e) => setNewCustomSectionBody(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                    placeholder="Section body"
                  />
                  <input
                    value={newCustomSectionOptions}
                    onChange={(e) => setNewCustomSectionOptions(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm md:col-span-4"
                    placeholder="Dropdown options (comma separated, optional)"
                  />
                </div>
                <button onClick={addCustomPortalSection} className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                  Add Section
                </button>
                <div className="mt-3 space-y-2">
                  {brandCustomSections.map((section, idx) => (
                    <article key={section.id} className="rounded border border-slate-200 p-2">
                      <div className="grid gap-2 md:grid-cols-5">
                        <input
                          value={section.title}
                          onChange={(e) => updateCustomPortalSection(idx, { title: e.target.value })}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                        />
                        <select
                          value={section.fieldType || "text"}
                          onChange={(e) => updateCustomPortalSection(idx, { fieldType: e.target.value as CustomPortalSection["fieldType"] })}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                        >
                          {PORTAL_FIELD_TYPES.map((type) => (
                            <option key={`${section.id}-ft-${type}`} value={type}>{type}</option>
                          ))}
                        </select>
                        <select
                          value={(section.visibleFor && section.visibleFor[0]) || "all"}
                          onChange={(e) => updateCustomPortalSection(idx, { visibleFor: [e.target.value] })}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                        >
                          {PORTAL_VISIBILITY_OPTIONS.map((item) => (
                            <option key={`${section.id}-vis-${item}`} value={item}>{item}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={section.enabled !== false}
                            onChange={(e) => updateCustomPortalSection(idx, { enabled: e.target.checked })}
                          />
                          Enabled
                        </label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveCustomPortalSection(idx, -1)} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold">Up</button>
                          <button onClick={() => moveCustomPortalSection(idx, 1)} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold">Down</button>
                        </div>
                      </div>
                      <textarea
                        value={section.body}
                        onChange={(e) => updateCustomPortalSection(idx, { body: e.target.value })}
                        className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                        rows={3}
                      />
                      {(section.fieldType || "text") === "dropdown" ? (
                        <input
                          value={(section.options || []).join(", ")}
                          onChange={(e) =>
                            updateCustomPortalSection(idx, {
                              options: e.target.value
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean)
                            })
                          }
                          className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="Dropdown options (comma separated)"
                        />
                      ) : null}
                      <button
                        onClick={() => removeCustomPortalSection(idx)}
                        className="mt-2 rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                  {brandCustomSections.length === 0 ? <p className="text-xs text-slate-500">No custom sections yet.</p> : null}
                </div>
                <p className="mt-2 text-xs text-slate-600">Save Branding to publish changes.</p>
                <div className="mt-3 rounded border border-slate-200 p-2">
                  <p className="text-xs font-semibold text-slate-700">Version History</p>
                  <div className="mt-2 max-h-36 space-y-2 overflow-auto">
                    {brandCustomSectionHistory.slice(0, 8).map((version) => (
                      <div key={version.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-xs">
                        <p>
                          {new Date(version.createdAt).toLocaleString()} {version.actorName ? `• ${version.actorName}` : ""}
                        </p>
                        <button
                          onClick={() => void rollbackCustomPortalSections(version.id)}
                          className="rounded border border-slate-300 px-2 py-1 font-semibold"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                    {brandCustomSectionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500">No previous versions.</p>
                    ) : null}
                  </div>
                </div>
              </section>

              {sessionUser?.userType === "staff" && sessionUser.role === "Admin" ? (
                <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                  <h3 className="text-base font-semibold">Audit Trail</h3>
                  <p className="mt-1 text-xs text-slate-500">Immutable latest security and data-change events.</p>
                  <div className="mt-2 max-h-52 space-y-2 overflow-auto rounded border border-slate-200 p-2 text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="rounded border border-slate-200 p-2">
                        <p className="font-semibold">{log.action}</p>
                        <p className="text-slate-500">
                          {new Date(log.createdAt).toLocaleString()} • {log.actorName} • {log.resourceId}
                        </p>
                      </div>
                    ))}
                    {auditLogs.length === 0 ? <p className="text-slate-500">No audit entries found.</p> : null}
                  </div>
                  {auditStatus ? <p className="mt-2 text-xs text-slate-700">{auditStatus}</p> : null}
                </section>
              ) : null}

              {sessionUser?.userType === "staff" && canManageUsers(sessionUser.role) ? (
                <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                  <h3 className="text-base font-semibold">Team Management</h3>
                  <p className="mt-1 text-xs text-slate-500">Admin can add and manage team members here.</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-5">
                    <input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                      placeholder="Full name"
                    />
                    <input
                      value={teamEmail}
                      onChange={(e) => setTeamEmail(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                      placeholder="Email"
                    />
                    <select
                      value={teamRole}
                      onChange={(e) => setTeamRole(e.target.value as Role)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="Marketing">Marketing</option>
                      <option value="Processing">Processing</option>
                      <option value="ProcessingLead">Processing Lead</option>
                      <option value="Reviewer">Reviewer</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <input
                      value={teamPassword}
                      onChange={(e) => setTeamPassword(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                      placeholder="Temporary password"
                    />
                    <input
                      value={teamDriveLink}
                      onChange={(e) => setTeamDriveLink(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm md:col-span-2"
                      placeholder="Workspace Drive folder link (optional)"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => void addTeamMember()}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Add Team Member
                    </button>
                    <button
                      onClick={() => void syncNewtonTeamPreset()}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                    >
                      Sync Newton Team Preset
                    </button>
                  </div>
                  {teamStatus ? <p className="mt-2 text-xs text-slate-600">{teamStatus}</p> : null}

                  <div className="mt-3 max-h-52 overflow-auto rounded border border-slate-200">
                    {teamUsers.map((u) => (
                      <div key={u.id} className="border-b border-slate-100 px-3 py-2 text-xs">
                        {(() => {
                          const ownerBlocked = false;
                          return (
                            <>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-slate-500">{u.email}</p>
                            {u.workspaceDriveLink ? (
                              <a href={u.workspaceDriveLink} target="_blank" className="text-[11px] text-blue-700 underline">
                                Workspace Drive
                              </a>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">{u.role}</span>
                            <span
                              className={`rounded px-2 py-1 font-semibold ${
                                u.active === false ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {u.active === false ? "Inactive" : "Active"}
                            </span>
                            <span
                              className={`rounded px-2 py-1 font-semibold ${
                                u.mfaEnabled ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.mfaEnabled ? "MFA On" : "MFA Off"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
                          <input
                            value={teamPasswordDrafts[u.id] || ""}
                            onChange={(e) =>
                              setTeamPasswordDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))
                            }
                            className="rounded border border-slate-300 px-2 py-1"
                            placeholder="New password"
                          />
                          <button
                            onClick={() => void resetTeamMemberPassword(u.id)}
                            disabled={ownerBlocked}
                            className="rounded border border-slate-300 px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => void resetTeamMemberMfa(u.id)}
                            disabled={ownerBlocked}
                            className="rounded border border-slate-300 px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reset MFA
                          </button>
                          <button
                            onClick={() => void setTeamMemberActive(u.id, u.active === false)}
                            disabled={ownerBlocked}
                            className={`rounded px-2 py-1 font-semibold text-white ${
                              u.active === false ? "bg-emerald-600" : "bg-rose-600"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {u.active === false ? "Activate" : "Deactivate"}
                          </button>
                        </div>
                        {ownerBlocked ? <p className="mt-1 text-[11px] text-amber-700">Restricted user action.</p> : null}
                            </>
                          );
                        })()}
                      </div>
                    ))}
                    {teamUsers.length === 0 ? <p className="px-3 py-2 text-xs text-slate-500">No team members found.</p> : null}
                  </div>
              </section>
            ) : null}

            {clientScreen === "results" ? (
              <section className="rounded-2xl border-2 border-slate-500 bg-white p-4 shadow-sm">
                <button onClick={() => setClientScreen("overview")} className="mb-2 rounded border border-slate-300 px-2 py-1 text-xs font-semibold">Back to Tasks</button>
                <h3 className="text-base font-semibold">Your Results</h3>
                <p className="mt-1 text-xs text-slate-500">Any completed result shared by Newton Immigration will appear here.</p>
                {selectedCase?.finalOutcome === "approved" ? (
                  <div className="mt-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900">
                    <p className="font-semibold">Congratulations, we got your permit approved.</p>
                    <p className="mt-1">If you found our service helpful, we would be grateful for your review.</p>
                    <a href="https://g.page/r/CYTdpFJ-nDr7EAE/review" target="_blank" className="mt-1 inline-block font-semibold underline">
                      Leave a Review
                    </a>
                  </div>
                ) : null}
                {selectedCase?.finalOutcome === "refused" ? (
                  <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    <p className="font-semibold">We have received your refusal update.</p>
                    <p className="mt-1">Our team will guide you on next steps and options.</p>
                  </div>
                ) : null}
                {selectedCase?.finalOutcome === "request_letter" ? (
                  <div className="mt-3 rounded border border-blue-300 bg-blue-50 p-3 text-xs text-blue-900">
                    <p className="font-semibold">A request letter was issued for your case.</p>
                    <p className="mt-1">Please review the result files and follow instructions from your case team.</p>
                  </div>
                ) : null}
                <div className="mt-3 space-y-2">
                  {resultDocuments.map((d) => (
                    <article key={d.id} className="rounded border border-slate-200 p-2">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleString()}</p>
                      {d.link ? (
                        <a href={d.link} target="_blank" className="text-xs text-blue-700 underline">
                          Open Result
                        </a>
                      ) : null}
                    </article>
                  ))}
                  {resultDocuments.length === 0 ? (
                    <p className="text-xs text-slate-500">Your application is processing. When there is an update, you will see it here.</p>
                  ) : null}
                </div>
              </section>
            ) : null}
            </>
          ) : null}

          {screen === "settings" ? (
            <>
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

              <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                <h3 className="text-base font-semibold">Customize Client Portal</h3>
                <p className="mt-1 text-xs text-slate-500">Add/edit/remove custom sections shown automatically in client portal.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <input
                    value={newCustomSectionTitle}
                    onChange={(e) => setNewCustomSectionTitle(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                    placeholder="Section title"
                  />
                  <select
                    value={newCustomSectionFieldType}
                    onChange={(e) => setNewCustomSectionFieldType(e.target.value as CustomPortalSection["fieldType"])}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                  >
                    {PORTAL_FIELD_TYPES.map((type) => (
                      <option key={`new-ft-settings-${type}`} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={newCustomSectionVisibleFor}
                    onChange={(e) => setNewCustomSectionVisibleFor(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                  >
                    {PORTAL_VISIBILITY_OPTIONS.map((item) => (
                      <option key={`new-vis-settings-${item}`} value={item}>{item}</option>
                    ))}
                  </select>
                  <input
                    value={newCustomSectionBody}
                    onChange={(e) => setNewCustomSectionBody(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                    placeholder="Section body"
                  />
                  <input
                    value={newCustomSectionOptions}
                    onChange={(e) => setNewCustomSectionOptions(e.target.value)}
                    className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm md:col-span-4"
                    placeholder="Dropdown options (comma separated, optional)"
                  />
                </div>
                <button onClick={addCustomPortalSection} className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                  Add Section
                </button>
                <div className="mt-3 space-y-2">
                  {brandCustomSections.map((section, idx) => (
                    <article key={section.id} className="rounded border border-slate-200 p-2">
                      <div className="grid gap-2 md:grid-cols-5">
                        <input
                          value={section.title}
                          onChange={(e) => updateCustomPortalSection(idx, { title: e.target.value })}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                        />
                        <select
                          value={section.fieldType || "text"}
                          onChange={(e) => updateCustomPortalSection(idx, { fieldType: e.target.value as CustomPortalSection["fieldType"] })}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                        >
                          {PORTAL_FIELD_TYPES.map((type) => (
                            <option key={`${section.id}-settings-ft-${type}`} value={type}>{type}</option>
                          ))}
                        </select>
                        <select
                          value={(section.visibleFor && section.visibleFor[0]) || "all"}
                          onChange={(e) => updateCustomPortalSection(idx, { visibleFor: [e.target.value] })}
                          className="rounded border border-slate-300 px-2 py-2 text-xs"
                        >
                          {PORTAL_VISIBILITY_OPTIONS.map((item) => (
                            <option key={`${section.id}-settings-vis-${item}`} value={item}>{item}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={section.enabled !== false}
                            onChange={(e) => updateCustomPortalSection(idx, { enabled: e.target.checked })}
                          />
                          Enabled
                        </label>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveCustomPortalSection(idx, -1)} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold">Up</button>
                          <button onClick={() => moveCustomPortalSection(idx, 1)} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold">Down</button>
                        </div>
                      </div>
                      <textarea
                        value={section.body}
                        onChange={(e) => updateCustomPortalSection(idx, { body: e.target.value })}
                        className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                        rows={3}
                      />
                      {(section.fieldType || "text") === "dropdown" ? (
                        <input
                          value={(section.options || []).join(", ")}
                          onChange={(e) =>
                            updateCustomPortalSection(idx, {
                              options: e.target.value
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean)
                            })
                          }
                          className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                          placeholder="Dropdown options (comma separated)"
                        />
                      ) : null}
                      <button
                        onClick={() => removeCustomPortalSection(idx)}
                        className="mt-2 rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                  {brandCustomSections.length === 0 ? <p className="text-xs text-slate-500">No custom sections yet.</p> : null}
                </div>
                <p className="mt-2 text-xs text-slate-600">Save Branding to publish changes.</p>
                <div className="mt-3 rounded border border-slate-200 p-2">
                  <p className="text-xs font-semibold text-slate-700">Version History</p>
                  <div className="mt-2 max-h-36 space-y-2 overflow-auto">
                    {brandCustomSectionHistory.slice(0, 8).map((version) => (
                      <div key={version.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-xs">
                        <p>
                          {new Date(version.createdAt).toLocaleString()} {version.actorName ? `• ${version.actorName}` : ""}
                        </p>
                        <button
                          onClick={() => void rollbackCustomPortalSections(version.id)}
                          className="rounded border border-slate-300 px-2 py-1 font-semibold"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                    {brandCustomSectionHistory.length === 0 ? (
                      <p className="text-xs text-slate-500">No previous versions.</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                <h3 className="text-base font-semibold">System Checks</h3>
                <p className="mt-1 text-xs text-slate-500">Run readiness and security checks before team operations.</p>
                <button
                  onClick={() => void runDiagnosticsBot()}
                  className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  Run Security Bot
                </button>
                {diagnosticsStatus ? <p className="mt-2 text-xs text-slate-700">{diagnosticsStatus}</p> : null}
              </section>

              {sessionUser?.userType === "staff" && sessionUser.role === "Admin" ? (
                <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                  <h3 className="text-base font-semibold">Audit Trail</h3>
                  <p className="mt-1 text-xs text-slate-500">Immutable latest security and data-change events.</p>
                  <div className="mt-2 max-h-52 space-y-2 overflow-auto rounded border border-slate-200 p-2 text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="rounded border border-slate-200 p-2">
                        <p className="font-semibold">{log.action}</p>
                        <p className="text-slate-500">
                          {new Date(log.createdAt).toLocaleString()} • {log.actorName} • {log.resourceId}
                        </p>
                      </div>
                    ))}
                    {auditLogs.length === 0 ? <p className="text-slate-500">No audit entries found.</p> : null}
                  </div>
                  {auditStatus ? <p className="mt-2 text-xs text-slate-700">{auditStatus}</p> : null}
                </section>
              ) : null}

              {sessionUser?.userType === "staff" && canManageUsers(sessionUser.role) ? (
                <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                  <h3 className="text-base font-semibold">Team Management</h3>
                  <p className="mt-1 text-xs text-slate-500">Add users, reset passwords, and map Drive workspaces.</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-5">
                    <input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                      placeholder="Full name"
                    />
                    <input
                      value={teamEmail}
                      onChange={(e) => setTeamEmail(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                      placeholder="Email"
                    />
                    <select
                      value={teamRole}
                      onChange={(e) => setTeamRole(e.target.value as Role)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="Marketing">Marketing</option>
                      <option value="Processing">Processing</option>
                      <option value="ProcessingLead">Processing Lead</option>
                      <option value="Reviewer">Reviewer</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <input
                      value={teamPassword}
                      onChange={(e) => setTeamPassword(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
                      placeholder="Temporary password"
                    />
                    <input
                      value={teamDriveLink}
                      onChange={(e) => setTeamDriveLink(e.target.value)}
                      className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm md:col-span-2"
                      placeholder="Workspace Drive folder link (optional)"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => void addTeamMember()}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Add Team Member
                    </button>
                    <button
                      onClick={() => void syncNewtonTeamPreset()}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                    >
                      Sync Newton Team Preset
                    </button>
                  </div>
                  {teamStatus ? <p className="mt-2 text-xs text-slate-600">{teamStatus}</p> : null}
                </section>
              ) : null}
            </>
          ) : null}

          {screen === "cases" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              {caseBoardView === "home" ? (
                <>
                  <h3 className="text-base font-semibold">Case Screens</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-5">
                    <button onClick={() => setCaseBoardView("new_cases")} className="rounded-xl border-2 border-slate-300 bg-white p-4 text-left">
                      <p className="text-xs text-slate-500">Queue</p>
                      <p className="mt-1 text-lg font-semibold">New Cases</p>
                      <p className="text-xs text-slate-500">{newCasesList.length} case(s)</p>
                    </button>
                    <button onClick={() => setCaseBoardView("assigned_cases")} className="rounded-xl border-2 border-slate-300 bg-white p-4 text-left">
                      <p className="text-xs text-slate-500">Queue</p>
                      <p className="mt-1 text-lg font-semibold">Assigned Cases</p>
                      <p className="text-xs text-slate-500">{assignedCasesList.length} case(s)</p>
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
                      <p className="text-xs text-red-700">{visibleCases.filter((c) => isUrgentCase(c)).length} case(s)</p>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                      {caseBoardView === "new_cases"
                        ? "New Cases"
                        : caseBoardView === "assigned_cases"
                          ? "Assigned Cases"
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
                  <div className="mt-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <input
                        value={caseSearch}
                        onChange={(e) => setCaseSearch(e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="Search by case id, client, application, assignee"
                      />
                      <select
                        value={caseAssignedFilter}
                        onChange={(e) => setCaseAssignedFilter(e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-2 text-xs"
                      >
                        <option value="all">All assignees</option>
                        {PROCESSING_TEAM_MEMBERS.filter((m) => m !== "Unassigned").map((member) => (
                          <option key={member} value={member}>
                            {member}
                          </option>
                        ))}
                      </select>
                      <select
                        value={caseStatusFilter}
                        onChange={(e) =>
                          setCaseStatusFilter(
                            e.target.value as "all" | "docs_pending" | "under_review" | "submitted" | "other"
                          )
                        }
                        className="w-full rounded border border-slate-300 px-2 py-2 text-xs"
                      >
                        <option value="all">All statuses</option>
                        <option value="docs_pending">Docs Pending</option>
                        <option value="under_review">Under Review</option>
                        <option value="submitted">Submitted</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {caseSearchSuggestions.length > 0 ? (
                      <select
                        className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                        defaultValue=""
                        onChange={(e) => {
                          const caseId = e.target.value;
                          if (!caseId) return;
                          setSelectedCaseId(caseId);
                          setCaseBoardView("all_cases");
                        }}
                      >
                        <option value="">Select from search results...</option>
                        {caseSearchSuggestions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.id} - {c.client} - {c.formType}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                  <div className="mt-2 grid max-h-[58vh] gap-2 overflow-auto pr-1">
                    {activeCaseBoardListFiltered.map((c) => (
                      <article
                        key={c.id}
                        className={`rounded-lg border p-3 text-left text-xs ${
                          selectedCase?.id === c.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="grid gap-2 md:grid-cols-9">
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
                            <p className="text-[11px] text-slate-500">Assigned To</p>
                            <select
                              value={String(c.assignedTo || "Unassigned")}
                              onChange={(e) => void updateCaseProcessing(c.id, { assignedTo: e.target.value })}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold"
                            >
                              {PROCESSING_TEAM_MEMBERS.map((member) => (
                                <option key={member} value={member}>
                                  {member}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">Status</p>
                            <select
                              value={c.processingStatus || "docs_pending"}
                              onChange={(e) =>
                                void updateCaseProcessing(c.id, {
                                  processingStatus: e.target.value as "docs_pending" | "under_review" | "submitted" | "other",
                                  processingStatusOther:
                                    e.target.value === "other" ? c.processingStatusOther || "" : ""
                                })
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold"
                            >
                              {PROCESSING_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {(c.processingStatus || "docs_pending") === "other" ? (
                              <input
                                defaultValue={c.processingStatusOther || ""}
                                onBlur={(e) =>
                                  void updateCaseProcessing(c.id, {
                                    processingStatus: "other",
                                    processingStatusOther: e.target.value
                                  })
                                }
                                placeholder="Type custom status"
                                className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-[11px]"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">Last Updated</p>
                            <p className="font-semibold">
                              {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "-"}
                            </p>
                            {c.applicationNumber ? (
                              <p className="text-[11px] text-slate-600">App#: {c.applicationNumber}</p>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500">Payment Method</p>
                            <p className="font-semibold">
                              {c.paymentMethod === "interac" ? "Interac" : c.paymentMethod || "-"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              IRCC: {c.irccFeePayer === "sir_card" ? "Sir Card" : "Client Card"}
                            </p>
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
                    {activeCaseBoardListFiltered.length === 0 ? (
                      <p className="text-xs text-slate-500">No cases in this screen.</p>
                    ) : null}
                  </div>
                  {caseActionStatus ? <p className="mt-2 text-xs text-slate-700">{caseActionStatus}</p> : null}
                </>
              )}

              {selectedCase ? (
                <>
                  <div className="mt-3 rounded-lg border-2 border-slate-300 p-3">
                    <p className="text-sm font-semibold">Case Detail</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => setCaseDetailTab("overview")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "overview" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Overview</button>
                      <button onClick={() => setCaseDetailTab("profile")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "profile" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Client Profile</button>
                      <button onClick={() => setCaseDetailTab("documents")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "documents" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Documents</button>
                      <button onClick={() => setCaseDetailTab("tasks")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "tasks" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Tasks</button>
                      <button onClick={() => setCaseDetailTab("communication")} className={`rounded border px-3 py-1 text-xs font-semibold ${caseDetailTab === "communication" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>Communication</button>
                    </div>

                    {caseDetailTab === "profile" ? (
                      <div className="mt-3 space-y-3 text-xs">
                        <div className="grid gap-2 md:grid-cols-4">
                          <div className="rounded border border-slate-200 p-2">
                            <p className="text-slate-500">Client Name</p>
                            <p className="font-semibold">{selectedCase.client || "Client"}</p>
                          </div>
                          <div className="rounded border border-slate-200 p-2">
                            <p className="text-slate-500">Phone</p>
                            <p className="font-semibold">{selectedCase.leadPhone || "-"}</p>
                          </div>
                          <div className="rounded border border-slate-200 p-2">
                            <p className="text-slate-500">Email</p>
                            <p className="font-semibold">{selectedCase.leadEmail || "-"}</p>
                          </div>
                          <div className="rounded border border-slate-200 p-2">
                            <p className="text-slate-500">Client ID</p>
                            <p className="font-semibold">{selectedCase.clientId || "Not linked yet"}</p>
                          </div>
                        </div>

                        <div className="rounded border border-slate-200 p-2">
                          <p className="font-semibold">Current Status</p>
                          <div className="mt-2 grid gap-2 md:grid-cols-4">
                            <div>
                              <p className="text-slate-500">Application</p>
                              <p className="font-semibold">{selectedCase.formType}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Stage</p>
                              <p className="font-semibold">{selectedCase.stage}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Assigned Staff</p>
                              <p className="font-semibold">{selectedCase.assignedTo || selectedCase.owner || "Unassigned"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Pending Tasks</p>
                              <p className="font-semibold">{caseTasks.filter((t) => t.status !== "completed").length}</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded border border-slate-200 p-2">
                          <p className="font-semibold">Application History</p>
                          <div className="mt-2 space-y-2">
                            {clientRelatedCases.map((c) => (
                              <div key={c.id} className="rounded border border-slate-200 p-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold">
                                    {c.id} - {c.formType}
                                  </p>
                                  <p className="text-slate-500">
                                    Submitted: {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "-"}
                                  </p>
                                </div>
                                <p className="text-slate-600">
                                  {c.finalOutcome
                                    ? `${c.finalOutcome === "approved" ? "Approved" : c.finalOutcome === "refused" ? "Refused" : c.finalOutcome === "request_letter" ? "Request Letter" : "Withdrawn"}${c.decisionDate ? ` on ${new Date(c.decisionDate).toLocaleDateString()}` : ""}`
                                    : "Outcome pending"}
                                </p>
                                {c.remarks ? <p className="mt-1 text-slate-600">Notes: {c.remarks}</p> : null}
                              </div>
                            ))}
                            {clientRelatedCases.length === 0 ? <p className="text-slate-500">No timeline records yet.</p> : null}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded border border-slate-200 p-2">
                            <p className="font-semibold">Documents</p>
                            <div className="mt-2 space-y-2">
                              {documents.map((d) => (
                                <div key={d.id} className="rounded border border-slate-100 p-2">
                                  <p className="font-semibold">{d.name}</p>
                                  <p className="text-slate-500">
                                    Type: {d.fileType || d.category || "general"} • Version: {Number(d.version || 1)}
                                  </p>
                                </div>
                              ))}
                              {documents.length === 0 ? <p className="text-slate-500">No documents uploaded.</p> : null}
                            </div>
                          </div>

                          <div className="rounded border border-slate-200 p-2">
                            <p className="font-semibold">Communication</p>
                            <div className="mt-2 space-y-2">
                              {messages.slice(0, 6).map((m) => (
                                <div key={m.id} className="rounded border border-slate-100 p-2">
                                  <p className="font-semibold">
                                    {m.senderName} <span className="font-normal text-slate-500">({m.senderType})</span>
                                  </p>
                                  <p>{m.text}</p>
                                </div>
                              ))}
                              {messages.length === 0 ? <p className="text-slate-500">No communication records yet.</p> : null}
                            </div>
                          </div>
                        </div>

                        <div className="rounded border border-slate-200 p-2">
                          <p className="font-semibold">Internal Flags</p>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <div className="rounded border border-slate-100 p-2">
                              <p className="text-slate-500">Previous refusals</p>
                              <p className="font-semibold">
                                {String(selectedCase.pgwpIntake?.refusedAnyCountry || "").trim() || "Not flagged"}
                              </p>
                            </div>
                            <div className="rounded border border-slate-100 p-2">
                              <p className="text-slate-500">Criminal history</p>
                              <p className="font-semibold">
                                {String(selectedCase.pgwpIntake?.criminalHistory || "").trim() || "Not flagged"}
                              </p>
                            </div>
                            <div className="rounded border border-slate-100 p-2">
                              <p className="text-slate-500">Medical history</p>
                              <p className="font-semibold">
                                {String(selectedCase.pgwpIntake?.medicalHistory || "").trim() || "Not flagged"}
                              </p>
                            </div>
                            <div className="rounded border border-slate-100 p-2">
                              <p className="text-slate-500">Missing docs</p>
                              <p className="font-semibold">{docRequests.filter((r) => r.status === "open").length}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

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
                          <p className="text-slate-500">Assigned To</p>
                          <p className="font-semibold">{selectedCase.assignedTo || "Unassigned"}</p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">Processing Status</p>
                          <p className="font-semibold">
                            {selectedCase.processingStatus === "other"
                              ? selectedCase.processingStatusOther || "other"
                              : (selectedCase.processingStatus || "docs_pending").replace("_", " ")}
                          </p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">Total Charges</p>
                          <p className="font-semibold">${Number(selectedCase.totalCharges ?? selectedCase.servicePackage?.retainerAmount ?? 0)}</p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">IRCC Fees</p>
                          <p className="font-semibold">
                            ${Number(selectedCase.irccFees ?? 0)} ({selectedCase.irccFeePayer === "sir_card" ? "Sir Card" : "Client Card"})
                          </p>
                        </div>
                        <div className="rounded border border-slate-200 p-2">
                          <p className="text-slate-500">Payment Method</p>
                          <p className="font-semibold">{selectedCase.paymentMethod === "interac" ? "Interac" : selectedCase.paymentMethod || "-"}</p>
                        </div>
                        <div className="rounded border border-slate-200 p-2 md:col-span-4">
                          <p className="text-slate-500">Client Link Actions</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <input
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="Client email (optional)"
                              className="rounded border border-slate-300 px-2 py-2 text-xs"
                            />
                            <input
                              value={invitePhone}
                              onChange={(e) => setInvitePhone(e.target.value)}
                              placeholder="Client phone (optional)"
                              className="rounded border border-slate-300 px-2 py-2 text-xs"
                            />
                            <button
                              onClick={() => void createClientInvite()}
                              className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Create / Refresh Client Link
                            </button>
                            {inviteUrl ? (
                              <a href={inviteUrl} target="_blank" className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-blue-700 underline">
                                Open Client Link
                              </a>
                            ) : null}
                          </div>
                          {inviteStatus ? <p className="mt-1 text-xs text-slate-700">{inviteStatus}</p> : null}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button onClick={() => void shareInvite("copy")} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold">
                              Copy Message
                            </button>
                            <button onClick={() => void shareInvite("email")} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold">
                              Send Email
                            </button>
                            <button onClick={() => void shareInvite("whatsapp")} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold">
                              Send WhatsApp
                            </button>
                            <button onClick={() => void shareInvite("sms")} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold">
                              Send SMS
                            </button>
                          </div>
                          {inviteShareStatus ? <p className="mt-1 text-xs text-slate-700">{inviteShareStatus}</p> : null}
                          <p className="mt-2 text-slate-500">Processing Links</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedCase.questionnaireLink ? (
                              <a href={questionnaireUrl(selectedCase.questionnaireLink, selectedCase.id)} target="_blank" className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-blue-700 underline">
                                Open Questions
                              </a>
                            ) : null}
                            {selectedCase.docsUploadLink ? (
                              <a href={selectedCase.docsUploadLink} target="_blank" className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-blue-700 underline">
                                Open Documents Folder
                              </a>
                            ) : null}
                          </div>
                          {selectedCase.updatedAt ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Last updated: {new Date(selectedCase.updatedAt).toLocaleString()}
                            </p>
                          ) : null}
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
                        <div className="mb-3 rounded border border-slate-200 p-2 text-xs">
                          <p className="font-semibold">Sent Link History</p>
                          <div className="mt-2 max-h-40 space-y-2 overflow-auto">
                            {outboundMessages.map((o) => (
                              <div key={o.id} className="rounded border border-slate-200 p-2">
                                <p className="font-semibold">
                                  {o.channel.toUpperCase()} • {o.status}
                                </p>
                                <p className="text-slate-500">
                                  {new Date(o.createdAt).toLocaleString()} • by {o.createdByName}
                                </p>
                                {o.target ? <p className="text-slate-600">To: {o.target}</p> : null}
                              </div>
                            ))}
                            {outboundMessages.length === 0 ? (
                              <p className="text-slate-500">No sent link records yet.</p>
                            ) : null}
                          </div>
                        </div>
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
                        <div className="grid gap-2 md:grid-cols-5">
                          <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="rounded border border-slate-300 px-2 py-2" placeholder="Task title" />
                          <input value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} className="rounded border border-slate-300 px-2 py-2" placeholder="Description" />
                          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high")} className="rounded border border-slate-300 px-2 py-2">
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                          </select>
                          <select value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)} className="rounded border border-slate-300 px-2 py-2">
                            <option value="">Assign to</option>
                            {taskAssigneeOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="rounded border border-slate-300 px-2 py-2" />
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
                              <p className="text-slate-500">Assigned: {t.assignedTo} {t.dueDate ? `• Due: ${t.dueDate}` : ""}</p>
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
              ) : (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  Select a case from the list first to open Case Detail and send client link.
                </div>
              )}
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">QA / Security Test Bot</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Runs non-destructive system checks for auth, storage, invite policy, Drive config, and data integrity.
                      </p>
                    </div>
                    <button
                      onClick={() => void runDiagnosticsBot()}
                      className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Run Test Bot
                    </button>
                  </div>
                  {diagnosticsStatus ? <p className="mt-2 text-xs text-slate-700">{diagnosticsStatus}</p> : null}
                  {diagnosticsReport ? (
                    <div className="mt-3 rounded border border-slate-200 p-2 text-xs">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-2 py-1 text-[11px] font-semibold ${
                            diagnosticsReport.summary.overall === "pass"
                              ? "bg-emerald-100 text-emerald-800"
                              : diagnosticsReport.summary.overall === "warn"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          Overall: {diagnosticsReport.summary.overall.toUpperCase()}
                        </span>
                        <span className="text-slate-600">
                          Pass {diagnosticsReport.summary.passCount} | Warn {diagnosticsReport.summary.warnCount} | Fail {diagnosticsReport.summary.failCount}
                        </span>
                      </div>
                      <div className="max-h-48 space-y-2 overflow-auto">
                        {diagnosticsReport.checks.map((check) => (
                          <div key={check.id} className="rounded border border-slate-200 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold">{check.title}</p>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  check.status === "pass"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : check.status === "warn"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                {check.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-600">{check.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>

                <article className="rounded-lg border-2 border-slate-300 p-3">
                  <p className="text-sm font-semibold">Create Case</p>
                  <p className="mt-1 text-xs text-slate-500">Create a new client case before generating invite/payment link.</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-7">
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
                    {commFormType === "Other" ? (
                      <input
                        value={commFormTypeOther}
                        onChange={(e) => setCommFormTypeOther(e.target.value)}
                        className="rounded border border-slate-300 px-2 py-2 text-xs"
                        placeholder="Type custom application type"
                      />
                    ) : null}
                    <input
                      value={commPhone}
                      onChange={(e) => setCommPhone(e.target.value)}
                      placeholder="Phone number"
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    />
                    <input
                      value={commEmail}
                      onChange={(e) => setCommEmail(e.target.value)}
                      placeholder="Email address"
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    />
                    <input
                      value={commTotalCharges}
                      onChange={(e) => setCommTotalCharges(e.target.value)}
                      placeholder="Total charges (CAD)"
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    />
                    <input
                      value={commIrccFees}
                      onChange={(e) => setCommIrccFees(e.target.value)}
                      placeholder="IRCC fees (CAD)"
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    />
                    <select
                      value={commIrccFeePayer}
                      onChange={(e) => setCommIrccFeePayer(e.target.value as "sir_card" | "client_card")}
                      className="rounded border border-slate-300 px-2 py-2 text-xs"
                    >
                      <option value="sir_card">IRCC fees by Sir card</option>
                      <option value="client_card">IRCC fees by Client card</option>
                    </select>
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

                {allowDataDelete && sessionUser?.role === "Admin" && sessionUser?.userType === "staff" ? (
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

                <p className="mt-1 text-xs text-slate-500">
                  Invite link actions were moved to Cases tab (Case Detail → Client Link Actions).
                </p>
              </div>
            </section>
          ) : null}

          {screen === "results" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Results</h3>
              <p className="mt-1 text-xs text-slate-500">
                Daily result upload by application number. System auto-links NEW cases and tracks who is informed.
              </p>
              <div className="mt-3 rounded border border-slate-200 p-3 text-xs">
                <p className="font-semibold">Daily Result Upload</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <input
                    value={resultApplicationNumber}
                    onChange={(e) => setResultApplicationNumber(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-2"
                    placeholder="Application number"
                  />
                  <input
                    type="date"
                    value={legacyResultDate}
                    onChange={(e) => setLegacyResultDate(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-2"
                  />
                  <select
                    value={legacyResultOutcome}
                    onChange={(e) => setLegacyResultOutcome(e.target.value as "approved" | "refused" | "request_letter" | "other")}
                    className="rounded border border-slate-300 px-2 py-2"
                  >
                    <option value="other">Other</option>
                    <option value="approved">Approved</option>
                    <option value="refused">Refused</option>
                    <option value="request_letter">Request Letter</option>
                  </select>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <input
                    value={legacyResultClientName}
                    onChange={(e) => setLegacyResultClientName(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-2"
                    placeholder="Client name (optional)"
                  />
                  <input
                    value={legacyResultPhone}
                    onChange={(e) => setLegacyResultPhone(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-2"
                    placeholder="Phone (optional)"
                  />
                  <input
                    type="file"
                    onChange={(e) => setLegacyResultFile(e.target.files?.[0] || null)}
                    className="rounded border border-slate-300 px-2 py-2"
                  />
                </div>
                <textarea
                  value={legacyResultNotes}
                  onChange={(e) => setLegacyResultNotes(e.target.value)}
                  className="mt-2 w-full rounded border border-slate-300 px-2 py-2"
                  rows={2}
                  placeholder="Notes (optional)"
                />
                {resultAutoCategory ? (
                  <p className={`mt-2 text-xs font-semibold ${resultAutoCategory === "new" ? "text-emerald-700" : "text-amber-700"}`}>
                    Auto category: {resultAutoCategory === "new" ? "NEW (linked to portal case)" : "OLD (no submitted case match)"}
                  </p>
                ) : null}
                {resultLinkedCase ? (
                  <div className="mt-2 rounded border border-emerald-300 bg-emerald-50 p-2 text-emerald-900">
                    Linked case: {resultLinkedCase.id} - {resultLinkedCase.client} - {resultLinkedCase.formType}
                    <br />
                    Client ID: {resultLinkedCase.clientId || "N/A"} | Phone: {resultLinkedCase.leadPhone || "N/A"}
                  </div>
                ) : null}
                <button
                  onClick={() => void submitLegacyResult()}
                  className="mt-2 rounded bg-slate-900 px-3 py-2 font-semibold text-white"
                >
                  Upload Daily Result
                </button>
                {legacyResultStatus ? <p className="mt-2 text-slate-700">{legacyResultStatus}</p> : null}
              </div>

              <div className="mt-3 rounded border-2 border-amber-300 bg-amber-50 p-3 text-xs">
                <p className="font-semibold text-amber-900">Today&apos;s Results ({todaysResults.length})</p>
                <p className="mt-1 text-amber-900">Highlighted daily list. NEW entries auto-link to case + client portal result.</p>
                <div className="mt-2 max-h-56 space-y-2 overflow-auto rounded border border-amber-200 bg-white p-2">
                  {todaysResults.map((item) => (
                    <article key={item.id} className="rounded border border-slate-200 p-2">
                      <p className="font-semibold">
                        {item.applicationNumber} • {item.clientName}
                      </p>
                      <p className="text-slate-500">
                        {item.resultDate} • {item.outcome} • {item.autoCategory.toUpperCase()}
                      </p>
                      <p className="text-slate-500">
                        {item.matchedCaseId ? `Case: ${item.matchedCaseId}` : "Old client result"} • {item.matchedClientId ? `Client ID: ${item.matchedClientId}` : "Client ID: N/A"}
                      </p>
                      {item.fileLink ? (
                        <a href={item.fileLink} target="_blank" className="text-blue-700 underline">
                          Open uploaded result
                        </a>
                      ) : null}
                      <div className="mt-2">
                        {item.informedToClient ? (
                          <p className="text-emerald-700">
                            Sent to client {item.informedAt ? `on ${new Date(item.informedAt).toLocaleString()}` : ""}.
                          </p>
                        ) : (
                          <button
                            onClick={() => void markResultInformed(item.id)}
                            className="rounded border border-slate-300 px-2 py-1 font-semibold"
                          >
                            Send to Client (Mark Sent)
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                  {todaysResults.length === 0 ? <p className="text-slate-500">No results uploaded today.</p> : null}
                </div>
              </div>

              <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-xs">
                <p className="font-semibold text-rose-900">Client IDs Not Informed Yet ({notInformedResults.length})</p>
                <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded border border-rose-200 bg-white p-2">
                  {notInformedResults.map((item) => (
                    <article key={item.id} className="rounded border border-slate-200 p-2">
                      <p className="font-semibold">
                        {item.matchedClientId || "N/A"} • {item.applicationNumber}
                      </p>
                      <p className="text-slate-500">
                        {item.clientName} • {item.matchedCaseId || "old-client"} • {item.resultDate}
                      </p>
                    </article>
                  ))}
                  {notInformedResults.length === 0 ? <p className="text-slate-500">All uploaded results are marked informed.</p> : null}
                </div>
              </div>
            </section>
          ) : null}

          {screen === "submission" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Submission</h3>
              <p className="mt-1 text-xs text-slate-500">
                Select a pending case, enter application number, then mark it submitted.
              </p>
              <input
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                className="mt-2 w-full rounded border border-slate-300 px-2 py-2 text-xs"
                placeholder="Search case by ID, name, or application type"
              />
              <select
                value={selectedCase?.id ?? ""}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="mt-2 w-full rounded-lg border-2 border-slate-300 px-2 py-2 text-sm"
              >
                {submissionCaseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.client} - {c.formType}
                  </option>
                ))}
              </select>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input
                  value={submissionApplicationNumber}
                  onChange={(e) => setSubmissionApplicationNumber(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-2 text-xs"
                  placeholder="Application number"
                />
                <button
                  onClick={() => void submitCaseWithApplicationNumber()}
                  className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Mark Submitted
                </button>
                <div className="rounded border border-slate-200 px-2 py-2 text-xs">
                  {selectedCase?.applicationNumber ? `Current: ${selectedCase.applicationNumber}` : "No application number yet"}
                </div>
              </div>
              <div className="mt-3 rounded border border-slate-200 p-3 text-xs">
                <p className="font-semibold">Upload Submission Document</p>
                <p className="mt-1 text-slate-500">Files are stored in Drive under: Submitted / Submission.</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <select
                    value={submissionUploadType}
                    onChange={(e) =>
                      setSubmissionUploadType(
                        e.target.value as "submission_letter" | "wp_extension_letter"
                      )
                    }
                    className="rounded border border-slate-300 px-2 py-2"
                  >
                    <option value="submission_letter">Submission Letter</option>
                    <option value="wp_extension_letter">WP Extension Letter</option>
                  </select>
                  <input
                    type="file"
                    onChange={(e) => setSubmissionUploadFile(e.target.files?.[0] || null)}
                    className="rounded border border-slate-300 px-2 py-2"
                  />
                  <button
                    onClick={() => void uploadSubmissionDocument()}
                    className="rounded bg-slate-900 px-3 py-2 font-semibold text-white"
                  >
                    Upload Document
                  </button>
                </div>
                {submissionUploadStatus ? <p className="mt-2 text-slate-700">{submissionUploadStatus}</p> : null}
              </div>
              {submissionStatus ? <p className="mt-2 text-xs text-slate-700">{submissionStatus}</p> : null}
              <div className="mt-4 space-y-2">
                {visibleCases
                  .filter((c) => (c.processingStatus || "docs_pending") === "submitted")
                  .slice(0, 30)
                  .map((c) => (
                    <article key={c.id} className="rounded border border-slate-200 p-2 text-xs">
                      <p className="font-semibold">{c.id} - {c.client} - {c.formType}</p>
                      <p className="text-slate-600">
                        Application No: {c.applicationNumber || "-"} | Submitted: {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : "-"}
                      </p>
                    </article>
                  ))}
              </div>
            </section>
          ) : null}

          {screen === "accounting" ? (
            <section className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <h3 className="text-base font-semibold">Accounting</h3>
              <p className="mt-1 text-xs text-slate-500">Track paid amount and pending fees for each client.</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input
                  value={accountingSearch}
                  onChange={(e) => setAccountingSearch(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-2 text-xs"
                  placeholder="Search by case id, client, or application"
                />
                <select
                  value={accountingPaymentFilter}
                  onChange={(e) => setAccountingPaymentFilter(e.target.value as "all" | "pending" | "paid")}
                  className="w-full rounded border border-slate-300 px-2 py-2 text-xs"
                >
                  <option value="all">All payments</option>
                  <option value="pending">Pending only</option>
                  <option value="paid">Paid only</option>
                </select>
              </div>
              <div className="mt-3 space-y-2">
                {visibleCases
                  .filter((c) => {
                    const q = accountingSearch.trim().toLowerCase();
                    const matchesText = !q || `${c.id} ${c.client} ${c.formType}`.toLowerCase().includes(q);
                    const total = Number(c.servicePackage.retainerAmount || 0);
                    const paid = Number((c as CaseItem & { amountPaid?: number }).amountPaid || 0);
                    const status = paid >= total && total > 0 ? "paid" : "pending";
                    const matchesPayment =
                      accountingPaymentFilter === "all" ? true : status === accountingPaymentFilter;
                    return matchesText && matchesPayment;
                  })
                  .map((c) => {
                    const total = Number(c.servicePackage.retainerAmount || 0);
                    const paid = Number((c as CaseItem & { amountPaid?: number }).amountPaid || 0);
                    const remaining = Math.max(0, total - paid);
                    const payStatus = remaining <= 0 && total > 0 ? "paid" : "pending";
                    return (
                      <article key={c.id} className="rounded border border-slate-200 p-3 text-xs">
                        <div className="grid gap-2 md:grid-cols-7">
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
                          <div>
                            <p className="text-slate-500">Status</p>
                            <p className={`font-semibold ${payStatus === "paid" ? "text-emerald-700" : "text-amber-700"}`}>{payStatus}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Payment Method</p>
                            <select
                              value={c.paymentMethod || "interac"}
                              onChange={(e) =>
                                void updateCaseProcessing(c.id, {
                                  paymentMethod: e.target.value as "interac" | "cash" | "card" | "bank_transfer" | "other"
                                })
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold"
                            >
                              <option value="interac">Interac</option>
                              <option value="cash">Cash</option>
                              <option value="card">Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <p className="text-slate-500">Last Updated</p>
                            <p className="font-semibold">
                              {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "-"}
                            </p>
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
                            placeholder="Amount received"
                          />
                          <button
                            onClick={() => void recordAccountingPayment(c.id)}
                            className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Confirm Payment
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
              <div className="mt-3 rounded border border-slate-200 p-3 text-xs">
                <p className="font-semibold">Create Task (Any Team Workspace)</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <select value={teamTaskCaseId} onChange={(e) => setTeamTaskCaseId(e.target.value)} className="rounded border border-slate-300 px-2 py-2">
                    <option value="">Select case</option>
                    {visibleCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.client}
                      </option>
                    ))}
                  </select>
                  <input value={teamTaskTitle} onChange={(e) => setTeamTaskTitle(e.target.value)} className="rounded border border-slate-300 px-2 py-2" placeholder="Task title" />
                  <input value={teamTaskDescription} onChange={(e) => setTeamTaskDescription(e.target.value)} className="rounded border border-slate-300 px-2 py-2" placeholder="Description" />
                  <select value={teamTaskPriority} onChange={(e) => setTeamTaskPriority(e.target.value as "low" | "medium" | "high")} className="rounded border border-slate-300 px-2 py-2">
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                  <select value={teamTaskAssignedTo} onChange={(e) => setTeamTaskAssignedTo(e.target.value)} className="rounded border border-slate-300 px-2 py-2">
                    <option value="">Assign to</option>
                    {taskAssigneeOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <input type="date" value={teamTaskDueDate} onChange={(e) => setTeamTaskDueDate(e.target.value)} className="rounded border border-slate-300 px-2 py-2" />
                </div>
                <button onClick={() => void createTeamTask()} className="mt-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                  Add Team Task
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {tasks.map((t) => (
                  <article key={t.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.caseId} • {t.priority} • {t.status} • assigned: {t.assignedTo}
                    </p>
                    {t.dueDate ? <p className="text-xs text-slate-500">Due: {t.dueDate}</p> : null}
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
