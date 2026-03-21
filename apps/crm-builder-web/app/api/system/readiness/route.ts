import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getStorePath } from "@/lib/storage-paths";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dataBackend = String(process.env.DATA_BACKEND || "file").toLowerCase();
  const hasDatabaseUrl = Boolean(String(process.env.DATABASE_URL || "").trim());
  const mode =
    dataBackend === "postgres" && hasDatabaseUrl
      ? "postgres"
      : "file";

  const checks = [
    {
      key: "storage_mode",
      ok: mode === "postgres",
      detail:
        mode === "postgres"
          ? "PostgreSQL mode active"
          : `File mode active at ${getStorePath()}`
    },
    {
      key: "database_url",
      ok: hasDatabaseUrl,
      detail: hasDatabaseUrl ? "DATABASE_URL configured" : "DATABASE_URL missing"
    },
    {
      key: "env_split",
      ok: Boolean(String(process.env.APP_BASE_URL || "").trim()),
      detail: "Ensure separate dev/staging/prod services are configured"
    },
    {
      key: "session_ttl",
      ok: Boolean(String(process.env.SESSION_MAX_AGE_SECONDS || "").trim()),
      detail: "SESSION_MAX_AGE_SECONDS should be set explicitly"
    }
  ];

  return NextResponse.json({
    mode,
    checks,
    recommendation:
      mode === "file"
        ? "Run db:migrate:init + db:migrate:store, set DATA_BACKEND=postgres in staging first."
        : "PostgreSQL active. Continue with staging soak tests before production cutover."
  });
}

