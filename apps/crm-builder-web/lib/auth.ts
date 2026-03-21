import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { resolveUserFromSession } from "@/lib/store";

export const SESSION_COOKIE = "fd_session";
export const SESSION_MAX_AGE_SECONDS = Math.max(
  60 * 15,
  Number(process.env.SESSION_MAX_AGE_SECONDS || 60 * 60 * 12)
);

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

export function applySessionCookie(response: {
  cookies: {
    set: (input: {
      name: string;
      value: string;
      httpOnly: boolean;
      sameSite: "lax";
      secure: boolean;
      path: string;
      maxAge: number;
    }) => void;
  };
}, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}
