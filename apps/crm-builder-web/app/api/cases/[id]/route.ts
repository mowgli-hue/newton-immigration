import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { stageOrder } from "@/lib/data";
import { getCase, updateCaseProcessing, updateCaseStage } from "@/lib/store";

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
  const assignedTo = body?.assignedTo !== undefined ? String(body.assignedTo) : undefined;
  const processingStatusRaw = body?.processingStatus !== undefined ? String(body.processingStatus) : undefined;
  const processingStatus = (
    processingStatusRaw &&
    ["docs_pending", "under_review", "submitted", "other"].includes(processingStatusRaw)
      ? processingStatusRaw
      : undefined
  ) as "docs_pending" | "under_review" | "submitted" | "other" | undefined;
  const processingStatusOther =
    body?.processingStatusOther !== undefined ? String(body.processingStatusOther) : undefined;

  if (assignedTo !== undefined || processingStatus !== undefined || processingStatusOther !== undefined) {
    const updated = await updateCaseProcessing(user.companyId, params.id, {
      assignedTo,
      processingStatus,
      processingStatusOther
    });
    if (!updated) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ case: updated });
  }

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
