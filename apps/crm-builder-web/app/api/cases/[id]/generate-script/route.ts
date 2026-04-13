import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase } from "@/lib/rbac";
import { getCase } from "@/lib/store";
import { generateVisitorVisaScript } from "@/lib/ircc-script-generator";
import { PgwpIntakeData } from "@/lib/models";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.userType !== "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    visitDateFrom?: { year: string; month: string; day: string };
    visitDateTo?: { year: string; month: string; day: string };
    visitPurpose?: string;
    inviterLastName?: string;
    inviterFirstName?: string;
    inviterRelation?: string;
    inviterOrgName?: string;
    inviterProvince?: string;
    inviterStreetNum?: string;
    inviterStreet?: string;
    inviterCity?: string;
    inviterPostal?: string;
    inviterPhone?: string;
    inviterEmail?: string;
    funds?: string;
  };

  const intake = (caseItem.pgwpIntake || {}) as PgwpIntakeData;

  // Default visit dates — 3 months from now if not provided
  const now = new Date();
  const defaultFrom = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const defaultTo = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const visitDetails = {
    visitDateFrom: body.visitDateFrom || {
      year: String(defaultFrom.getFullYear()),
      month: String(defaultFrom.getMonth() + 1).padStart(2, "0"),
      day: String(defaultFrom.getDate()).padStart(2, "0"),
    },
    visitDateTo: body.visitDateTo || {
      year: String(defaultTo.getFullYear()),
      month: String(defaultTo.getMonth() + 1).padStart(2, "0"),
      day: String(defaultTo.getDate()).padStart(2, "0"),
    },
    visitPurpose: body.visitPurpose || `Visiting Canada for ${caseItem.formType}. Client: ${caseItem.client}.`,
    inviterLastName: body.inviterLastName,
    inviterFirstName: body.inviterFirstName,
    inviterRelation: body.inviterRelation || "09",
    inviterOrgName: body.inviterOrgName,
    inviterProvince: body.inviterProvince || "02",
    inviterStreetNum: body.inviterStreetNum || "123",
    inviterStreet: body.inviterStreet || "Main Street",
    inviterCity: body.inviterCity || "Toronto",
    inviterPostal: body.inviterPostal || "M5V 1A1",
    inviterPhone: body.inviterPhone,
    inviterEmail: body.inviterEmail,
    funds: body.funds || String(caseItem.servicePackage?.retainerAmount || "10000"),
  };

  const script = generateVisitorVisaScript(caseItem, intake, visitDetails);

  return NextResponse.json({
    script,
    caseId: caseItem.id,
    client: caseItem.client,
    generatedAt: new Date().toISOString(),
  });
}
