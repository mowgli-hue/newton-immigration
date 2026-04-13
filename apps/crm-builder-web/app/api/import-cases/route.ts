import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createCase, listCases } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "Admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    cases?: Array<{
      client: string; formType: string; leadPhone?: string; uci?: string;
      assignedTo?: string; stage?: string; processingStatus?: string;
      isUrgent?: boolean; additionalNotes?: string; permitExpiry?: string;
    }>;
    dryRun?: boolean;
  };

  const incoming = body.cases || [];
  if (!incoming.length) return NextResponse.json({ error: "No cases provided" }, { status: 400 });

  const existing = await listCases(user.companyId);
  const existingNames = new Set(existing.map(c => c.client.toLowerCase().trim().split(/\s+/).slice(0,2).join(" ")));

  let imported = 0, skipped = 0;
  const errors: string[] = [];

  for (const c of incoming) {
    if (!c.client?.trim()) { skipped++; continue; }
    const nameKey = c.client.toLowerCase().trim().split(/\s+/).slice(0,2).join(" ");
    if (existingNames.has(nameKey)) { skipped++; continue; }
    if (body.dryRun) { imported++; continue; }
    try {
      await createCase({
        companyId: user.companyId,
        client: c.client.trim(),
        formType: c.formType || "Other",
        leadPhone: c.leadPhone || undefined,
        assignedTo: c.assignedTo || undefined,
        stage: (c.stage as any) || "Active",
        processingStatus: (c.processingStatus as any) || "docs_pending",
        isUrgent: c.isUrgent || false,
        additionalNotes: c.additionalNotes || undefined,
        permitExpiryDate: c.permitExpiry || undefined,
        pgwpIntake: c.uci ? { uci: c.uci } as any : undefined,
        totalCharges: 0,
        createdByUserId: user.id,
        createdByName: user.name,
      });
      existingNames.add(nameKey);
      imported++;
    } catch (e) {
      errors.push(`${c.client}: ${(e as Error).message}`);
      skipped++;
    }
  }

  return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20), total: incoming.length, dryRun: body.dryRun || false });
}
