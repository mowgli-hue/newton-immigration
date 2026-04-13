import { NextRequest, NextResponse } from "next/server";

type RateBucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __crmRateLimitStore: Map<string, RateBucket> | undefined;
}

const WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQ_PER_WINDOW = Number(process.env.API_RATE_LIMIT_MAX || 180);

function getIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.ip || "unknown";
}

function rateLimitKey(request: NextRequest) {
  return `${getIp(request)}:${request.nextUrl.pathname}`;
}

function consumeRateLimit(request: NextRequest): boolean {
  const now = Date.now();
  if (!global.__crmRateLimitStore) {
    global.__crmRateLimitStore = new Map<string, RateBucket>();
  }
  const store = global.__crmRateLimitStore;
  const key = rateLimitKey(request);
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  store.set(key, current);
  return current.count <= MAX_REQ_PER_WINDOW;
}

function withSecurityHeaders(response: NextResponse) {
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    process.env.NODE_ENV === "production"
      ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  return response;
}

function isStateChangingMethod(method: string) {
  const value = String(method || "").toUpperCase();
  return value === "POST" || value === "PUT" || value === "PATCH" || value === "DELETE";
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("host") || request.nextUrl.host;
    return originUrl.host === host;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const isWhatsAppWebhook = request.nextUrl.pathname === "/api/whatsapp";
  if (isApi) {
    // Allow WhatsApp webhook from Meta servers
    if (isWhatsAppWebhook) {
      return withSecurityHeaders(NextResponse.next());
    }
    if (isStateChangingMethod(request.method) && !sameOrigin(request)) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Cross-site request rejected." },
          { status: 403 }
        )
      );
    }
    if (!consumeRateLimit(request)) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Too many requests. Please retry shortly." },
          { status: 429 }
        )
      );
    }
  }
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
