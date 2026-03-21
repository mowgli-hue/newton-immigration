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

