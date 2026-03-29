import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { listAuditLogs } from "@/lib/store";

function toCsvValue(value: string): string {
  const safe = String(value ?? "");
  if (safe.includes(",") || safe.includes("\"") || safe.includes("\n")) {
    return `"${safe.replace(/"/g, "\"\"")}"`;
  }
  return safe;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limit = Number(request.nextUrl.searchParams.get("limit") || "200");
  const logs = await listAuditLogs(user.companyId, limit);
  const format = String(request.nextUrl.searchParams.get("format") || "json").toLowerCase();

  if (format === "csv") {
    const header = [
      "timestamp",
      "actor_name",
      "actor_user_id",
      "action",
      "resource_type",
      "resource_id",
      "metadata_json"
    ].join(",");
    const rows = logs.map((log) =>
      [
        toCsvValue(log.createdAt),
        toCsvValue(log.actorName),
        toCsvValue(log.actorUserId),
        toCsvValue(log.action),
        toCsvValue(log.resourceType),
        toCsvValue(log.resourceId),
        toCsvValue(log.metadata ? JSON.stringify(log.metadata) : "")
      ].join(",")
    );
    const csv = `${header}\n${rows.join("\n")}\n`;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"audit-report-${timestamp}.csv\"`,
        "Cache-Control": "no-store"
      }
    });
  }

  return NextResponse.json({ logs });
}
