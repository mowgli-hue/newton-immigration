export type Role = "Admin" | "Marketing" | "Processing" | "ProcessingLead" | "Reviewer" | "Client";
export type UserType = "staff" | "client";
export type CaseStatus = "lead" | "active" | "under_review" | "ready" | "submitted";
export type AiStatus = "idle" | "collecting_docs" | "waiting_client" | "drafting" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed";
export type NotificationType = "deadline" | "missing_doc" | "ai_alert";
export type DocRequestStatus = "open" | "fulfilled";

export type PgwpIntakeData = {
  fullName?: string;
  applicationType?: string;
  applicationSpecificAnswers?: string;
  intendedWorkDetails?: string;
  usedOtherName?: string;
  otherNameDetails?: string;
  travelHistorySixMonths?: string;
  travelHistoryDetails?: string;
  currentCountry?: string;
  currentCountryStatus?: string;
  currentCountryFromDate?: string;
  currentCountryToDate?: string;
  previousCountries?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  placeOfBirthCity?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  nationalIdNumber?: string;
  usGreenCardNumber?: string;
  countryOfBirth?: string;
  citizenship?: string;
  uci?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  email?: string;
  phone?: string;
  nativeLanguage?: string;
  canCommunicateEnglishFrench?: string;
  preferredLanguage?: string;
  maritalStatus?: string;
  spouseName?: string;
  spouseDob?: string;
  spouseDateOfMarriage?: string;
  previousMarriageCommonLaw?: string;
  previousRelationshipDetails?: string;
  residentialAddress?: string;
  education?: string;
  educationDetails?: string;
  ieltsDetails?: string;
  englishTestTaken?: string;
  originalEntryDate?: string;
  originalEntryPlacePurpose?: string;
  originalEntryToCanadaPlace?: string;
  originalEntryPurpose?: string;
  recentEntryAny?: string;
  recentEntryDetails?: string;
  employmentHistory?: string;
  dliNameLocation?: string;
  programNameDuration?: string;
  completionLetterDate?: string;
  fullTimeStudentThroughout?: string;
  gapsOrPartTimeDetails?: string;
  previousCollegesInCanada?: string;
  academicProbationOrTransfer?: string;
  unauthorizedWorkDuringStudies?: string;
  hasRepresentative?: string;
  permitDetails?: string;
  studyPermitExpiryDate?: string;
  pastStudiesDetails?: string;
  currentStudyCompletionLetterDetails?: string;
  restorationNeeded?: string;
  fundsAvailable?: string;
  medicalExamCompleted?: string;
  refusedAnyCountry?: string;
  refusalDetails?: string;
  militaryServiceDetails?: string;
  criminalHistory?: string;
  medicalHistory?: string;
  additionalNotes?: string;
};

export type Stage =
  | "Lead"
  | "Paid"
  | "Intake"
  | "Assigned"
  | "Under Review"
  | "Submitted"
  | "Decision";

export type Company = {
  id: string;
  name: string;
  slug: string;
  branding: {
    appName: string;
    logoText: string;
    logoUrl?: string;
    driveRootLink?: string;
    primary: string;
    secondary: string;
    success: string;
    background: string;
    text: string;
  };
  createdAt: string;
};

export type CaseItem = {
  id: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
  clientId?: string;
  clientUserId?: string;
  client: string;
  caseStatus?: CaseStatus;
  aiStatus?: AiStatus;
  leadPhone?: string;
  leadEmail?: string;
  sourceLeadKey?: string;
  formType: string;
  assignedTo?: string;
  processingStatus?: "docs_pending" | "under_review" | "submitted" | "other";
  processingStatusOther?: string;
  isUrgent?: boolean;
  deadlineDate?: string;
  owner: string;
  reviewer: string;
  stage: Stage;
  dueInDays: number;
  unreadClientMessages: number;
  docsPending: number;
  balanceAmount: number;
  retainerSigned: boolean;
  retainerSentAt?: string;
  docsUploadLink: string;
  applicationFormsLink?: string;
  submittedFolderLink?: string;
  correspondenceFolderLink?: string;
  questionnaireLink: string;
  paymentMethod?: "interac";
  interacRecipient?: string;
  interacInstructions?: string;
  paymentStatus?: "pending" | "paid" | "not_required";
  paymentPaidAt?: string;
  amountPaid?: number;
  totalCharges?: number;
  irccFees?: number;
  irccFeePayer?: "sir_card" | "client_card";
  submittedAt?: string;
  decisionDate?: string;
  finalOutcome?: "approved" | "refused" | "request_letter" | "withdrawn";
  remarks?: string;
  imm5710Automation?: {
    status: "idle" | "started" | "failed";
    startedAt?: string;
    pid?: number;
    logPath?: string;
    readyPackagePath?: string;
    lastError?: string;
    autoTriggered?: boolean;
  };
  pgwpIntake?: PgwpIntakeData;
  docRequests?: Array<{
    id: string;
    title: string;
    details?: string;
    status: DocRequestStatus;
    requestedBy: string;
    requestedAt: string;
    fulfilledAt?: string;
    fulfilledBy?: string;
    documentId?: string;
  }>;
  retainerRecord?: {
    signedAt: string;
    signerName: string;
    signatureType: "initials" | "signature" | "typed";
    signatureValue: string;
    acceptedTerms: boolean;
  };
  servicePackage: {
    name: string;
    retainerAmount: number;
    balanceAmount: number;
    milestones: Array<{
      id: string;
      title: string;
      done: boolean;
    }>;
  };
  invoices: Array<{
    id: string;
    title: string;
    amount: number;
    status: "draft" | "sent" | "paid";
    createdAt: string;
  }>;
};

export type AppUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: Role;
  userType: UserType;
  active?: boolean;
  password: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaEnabledAt?: string;
  mfaLastVerifiedAt?: string;
  workspaceDriveLink?: string;
  workspaceDriveFolderId?: string;
  caseId?: string;
};

export type Session = {
  token: string;
  userId: string;
  companyId: string;
  expiresAt: string;
  ipAddress?: string;
  ipSubnet?: string;
  userAgent?: string;
  createdAt?: string;
};

export type ClientInvite = {
  token: string;
  companyId: string;
  caseId: string;
  email?: string;
  createdByUserId: string;
  usedByUserId?: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
};

export type MessageItem = {
  id: string;
  companyId: string;
  caseId: string;
  senderType: "client" | "staff" | "ai";
  senderName: string;
  text: string;
  createdAt: string;
};

export type OutboundMessageItem = {
  id: string;
  companyId: string;
  caseId: string;
  channel: "email" | "whatsapp" | "sms" | "link" | "copy";
  status: "queued" | "opened_app" | "sent" | "failed";
  target?: string;
  message: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
};

export type DocumentItem = {
  id: string;
  companyId: string;
  clientId?: string;
  caseId: string;
  name: string;
  category?: "general" | "result";
  fileType?: string;
  version?: number;
  versionGroupId?: string;
  status: "pending" | "received";
  link: string;
  createdAt: string;
};

export type ClientMaster = {
  id: string;
  companyId: string;
  clientCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  assignedTo?: string;
  internalFlags: {
    previousRefusals?: boolean;
    risks?: string;
    missingDocuments?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type ClientCommunication = {
  id: string;
  companyId: string;
  clientId: string;
  createdByUserId: string;
  createdByName: string;
  type: "note" | "call" | "email" | "ai";
  message: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  companyId: string;
  actorUserId: string;
  actorName: string;
  action: string;
  resourceType: "client_profile" | "client_note" | "client_invite" | "case";
  resourceId: string;
  metadata?: Record<string, string>;
  createdAt: string;
};

export type TaskItem = {
  id: string;
  companyId: string;
  caseId: string;
  title: string;
  description: string;
  assignedTo: string;
  createdBy: "ai" | "admin";
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  companyId: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
};

export type AppStore = {
  companies: Company[];
  users: AppUser[];
  clients: ClientMaster[];
  cases: CaseItem[];
  messages: MessageItem[];
  outboundMessages: OutboundMessageItem[];
  documents: DocumentItem[];
  clientCommunications: ClientCommunication[];
  auditLogs: AuditLog[];
  tasks: TaskItem[];
  notifications: NotificationItem[];
  sessions: Session[];
  invites: ClientInvite[];
};
