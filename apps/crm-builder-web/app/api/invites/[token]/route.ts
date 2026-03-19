import { NextResponse } from "next/server";
import { findCompanyById, getCase, getClientInviteByToken } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const invite = await getClientInviteByToken(params.token);
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  const company = await findCompanyById(invite.companyId);
  const caseItem = await getCase(invite.companyId, invite.caseId);
  if (!company || !caseItem) return NextResponse.json({ error: "Invite invalid" }, { status: 400 });

  return NextResponse.json({
    invite: {
      token: invite.token,
      status: invite.status,
      email: invite.email,
      expiresAt: invite.expiresAt
    },
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug
    },
    case: {
      id: caseItem.id,
      formType: caseItem.formType,
      stage: caseItem.stage,
      retainerSigned: caseItem.retainerSigned
    }
  });
}
