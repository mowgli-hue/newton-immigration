import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { resolveUserFromSession } from "@/lib/store";

export const SESSION_COOKIE = "fd_session";

export async function getCurrentUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveUserFromSession(token);
}

export async function getCurrentUserFromCookies() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveUserFromSession(token);
}
