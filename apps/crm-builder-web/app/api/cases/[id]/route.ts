import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { stageOrder } from "@/lib/data";
import { getCase, updateCaseStage } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const stage = String(body.stage ?? "");

  if (!stageOrder.includes(stage as (typeof stageOrder)[number])) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const updated = await updateCaseStage(user.companyId, params.id, stage as (typeof stageOrder)[number]);
  if (!updated) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json({ case: updated });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await getCase(user.companyId, params.id);
  if (!found) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  if (user.userType === "client" && user.caseId !== found.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ case: found });
}
