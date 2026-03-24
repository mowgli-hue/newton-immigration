import { Role } from "@/lib/models";

export type AppScreen =
  | "dashboard"
  | "cases"
  | "communications"
  | "results"
  | "accounting"
  | "tasks"
  | "chat"
  | "files";

const STAFF_ROLE_TAB_ACCESS: Record<Exclude<Role, "Client">, AppScreen[]> = {
  Admin: ["dashboard", "cases", "communications", "results", "accounting", "tasks", "chat", "files"],
  Marketing: ["dashboard", "communications", "results", "accounting"],
  Processing: ["dashboard", "cases", "tasks", "files", "chat"],
  ProcessingLead: ["dashboard", "cases", "tasks", "files", "chat"],
  Reviewer: ["dashboard", "cases", "tasks", "files", "chat"]
};

function normalizeRole(role: Role | string): Role {
  const value = String(role || "").trim().toLowerCase();
  if (value === "admin") return "Admin";
  if (value === "marketing") return "Marketing";
  if (value === "processing") return "Processing";
  if (value === "processinglead" || value === "processing lead") return "ProcessingLead";
  if (value === "reviewer") return "Reviewer";
  if (value === "client") return "Client";
  return "Client";
}

export function isStaffRole(role: Role): role is Exclude<Role, "Client"> {
  return normalizeRole(role) !== "Client";
}

export function tabsForRole(role: Role): AppScreen[] {
  const normalized = normalizeRole(role);
  if (normalized === "Client") return [];
  return STAFF_ROLE_TAB_ACCESS.Admin;
}

export function canManageUsers(role: Role): boolean {
  return normalizeRole(role) !== "Client";
}

export function canCreateCase(role: Role): boolean {
  return normalizeRole(role) !== "Client";
}

export function canUseAccounting(role: Role): boolean {
  return normalizeRole(role) !== "Client";
}

export function canUseCommunications(role: Role): boolean {
  return normalizeRole(role) !== "Client";
}

function normalize(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isCaseAssignedToUser(assignedTo: string | undefined, userName: string): boolean {
  const assigned = normalize(assignedTo || "");
  const user = normalize(userName || "");
  if (!assigned || assigned === "unassigned" || !user) return false;
  if (assigned === user) return true;
  return user.includes(assigned) || assigned.includes(user);
}

export function canStaffAccessCase(role: Role, userName: string, caseAssignedTo?: string): boolean {
  const normalized = normalizeRole(role);
  if (normalized === "Client") return false;
  return true;
}
