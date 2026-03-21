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

export function isStaffRole(role: Role): role is Exclude<Role, "Client"> {
  return role !== "Client";
}

export function tabsForRole(role: Role): AppScreen[] {
  if (!isStaffRole(role)) return [];
  return STAFF_ROLE_TAB_ACCESS[role] || [];
}

export function canManageUsers(role: Role): boolean {
  return role === "Admin";
}

export function canCreateCase(role: Role): boolean {
  return role === "Admin" || role === "Marketing" || role === "ProcessingLead";
}

export function canUseAccounting(role: Role): boolean {
  return role === "Admin" || role === "Marketing";
}

export function canUseCommunications(role: Role): boolean {
  return role === "Admin" || role === "Marketing";
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
  if (role === "Client") return false;
  if (role === "Processing") return isCaseAssignedToUser(caseAssignedTo, userName);
  return true;
}
