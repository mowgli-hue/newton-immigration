import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { getCurrentUserFromRequest } = await import("@/lib/auth");
    const { getCase } = await import("@/lib/store");

    let companyId = "newton";
    try {
      const user = await getCurrentUserFromRequest(request);
      if (user) companyId = user.companyId;
    } catch { /* allow system calls */ }

    const caseItem = await getCase(companyId, params.id);
    if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const phone = String(caseItem.leadPhone || "").replace(/\D/g, "");
    if (!phone) return NextResponse.json({ error: "No phone number on this case" }, { status: 400 });

    // Skip WhatsApp intake for College Change / SPE cases - handled manually
    const skipFormTypes = ["college change", "college transfer"];
    const formTypeLower = String(caseItem.formType || "").toLowerCase();
    if (skipFormTypes.some(t => formTypeLower.includes(t))) {
      return NextResponse.json({ ok: false, message: `WhatsApp intake skipped for ${caseItem.formType} — handled manually by team` });
    }

    console.log(`📱 WA Intake: ${caseItem.client} | formType: ${caseItem.formType} | phone: ${phone}`);

    // Use the AI conversational intake
    const { startIntakeSession } = await import("@/lib/whatsapp-ai-intake");
    const result = await startIntakeSession({
      caseId: params.id,
      companyId,
      phone,
      clientName: caseItem.client || "Client",
      formType: caseItem.formType || "PGWP",
    });

    return NextResponse.json({ 
      ok: result.success, 
      message: result.success 
        ? `AI intake started for ${caseItem.client} — waiting for client reply`
        : `Failed: ${result.error}` 
    });
  } catch (e) {
    console.error("wa-intake error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
