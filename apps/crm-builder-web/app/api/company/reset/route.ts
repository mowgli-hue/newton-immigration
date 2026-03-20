import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { resetCompanyDataToSingleCase } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff" || user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const allowDataDelete = String(process.env.ALLOW_DATA_DELETE || "").toLowerCase() === "true";
  if (!allowDataDelete) {
    return NextResponse.json({ error: "Data deletion is disabled in production." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const clientName = String(body?.clientName ?? "").trim() || "Nirmaljeet Kaur";
  const caseNumber = Number(body?.caseNumber ?? 1006);
  const formType = String(body?.formType ?? "PGWP").trim() || "PGWP";
  const confirmText = String(body?.confirmText ?? "").trim().toUpperCase();

  if (confirmText !== "RESET") {
    return NextResponse.json(
      { error: 'Set "confirmText" to "RESET" to confirm deleting test records.' },
      { status: 400 }
    );
  }

  const freshCase = await resetCompanyDataToSingleCase({
    companyId: user.companyId,
    clientName,
    caseNumber,
    formType,
    keepStaffSessions: true
  });

  return NextResponse.json({
    ok: true,
    message: "Company data reset complete",
    case: freshCase
  });
}
