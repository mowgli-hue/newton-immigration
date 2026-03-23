import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { canStaffAccessCase, canUseCommunications } from "@/lib/rbac";
import { createClientInvite, findCompanyById, getCase, getLatestClientInviteForCase } from "@/lib/store";

function baseUrlFromRequest(request: NextRequest) {
  const preferRequestHost =
    String(process.env.INVITE_URL_USE_REQUEST_HOST || "true").toLowerCase() === "true";
  const explicitBase = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || "").replace(/\/$/, "");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3006";
  const requestBase = `${proto}://${host}`;
  if (preferRequestHost || !explicitBase) return requestBase;
  return explicitBase;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canUseCommunications(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = body?.email ? String(body.email).trim() : undefined;

  try {
    const company = await findCompanyById(user.companyId);
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const invite = await createClientInvite({
      companyId: user.companyId,
      caseId: params.id,
      createdByUserId: user.id,
      email
    });

    const base = baseUrlFromRequest(request);
    const inviteUrl = `${base}/invite/${invite.token}`;
    const portalInviteUrl = `${base}/portal/${company.slug}?invite=${invite.token}`;
    return NextResponse.json({ invite, inviteUrl, portalInviteUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType !== "staff") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canUseCommunications(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });
  if (!canStaffAccessCase(user.role, user.name, caseItem.assignedTo)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invite = await getLatestClientInviteForCase(user.companyId, params.id);
  if (!invite) return NextResponse.json({ invite: null, inviteUrl: "" });
  const company = await findCompanyById(user.companyId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const base = baseUrlFromRequest(request);
  const inviteUrl = `${base}/invite/${invite.token}`;
  const portalInviteUrl = `${base}/portal/${company.slug}?invite=${invite.token}`;
  return NextResponse.json({ invite, inviteUrl, portalInviteUrl });
}
