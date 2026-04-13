import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { listCases, createCase, readStore, writeStore } from "@/lib/store";
import { Pool } from "pg";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "Admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    oldDbUrl?: string;
    dryRun?: boolean;
  };

  const oldDbUrl = body.oldDbUrl || process.env.OLD_CRM_DATABASE_URL;
  if (!oldDbUrl) {
    return NextResponse.json({ error: "OLD_CRM_DATABASE_URL not set" }, { status: 400 });
  }

  // Connect to old CRM database
  let oldPool: Pool | null = null;
  try {
    oldPool = new Pool({
      connectionString: oldDbUrl,
      max: 3,
      ssl: oldDbUrl.includes("localhost") ? false : { rejectUnauthorized: false }
    });

    // Read old store
    const result = await oldPool.query(
      "select payload from app_store_snapshots where id = $1 limit 1",
      ["global"]
    );

    if (!result.rowCount || !result.rows[0]?.payload) {
      return NextResponse.json({ error: "No data found in old CRM database" }, { status: 404 });
    }

    const oldStore = result.rows[0].payload as any;
    const oldCases = (oldStore.cases || []) as any[];
    const oldResults = (oldStore.legacyResults || []) as any[];
    const oldTasks = (oldStore.tasks || []) as any[];

    // Get existing cases in new CRM to avoid duplicates
    const existingCases = await listCases(user.companyId);
    const existingIds = new Set(existingCases.map(c => c.id));
    const existingNames = new Set(
      existingCases.map(c => c.client.toLowerCase().trim().split(/\s+/).slice(0,2).join(" "))
    );

    let importedCases = 0, skippedCases = 0;
    let importedResults = 0, importedTasks = 0;
    const errors: string[] = [];

    if (!body.dryRun) {
      // Import cases
      for (const c of oldCases) {
        if (!c.client?.trim()) { skippedCases++; continue; }
        
        // Skip if ID already exists
        if (existingIds.has(c.id)) { skippedCases++; continue; }
        
        // Skip if name already exists (from sheet import)
        const nameKey = c.client.toLowerCase().trim().split(/\s+/).slice(0,2).join(" ");
        if (existingNames.has(nameKey)) { skippedCases++; continue; }

        try {
          await createCase({
            companyId: user.companyId,
            client: c.client,
            formType: c.formType || "Other",
            leadPhone: c.leadPhone || undefined,
            leadEmail: c.leadEmail || undefined,
            assignedTo: c.assignedTo || undefined,
            stage: c.stage || "Active",
            processingStatus: c.processingStatus || "docs_pending",
            caseStatus: c.caseStatus || "lead",
            isUrgent: c.isUrgent || false,
            additionalNotes: c.additionalNotes || undefined,
            totalCharges: c.servicePackage?.retainerAmount || c.totalCharges || 0,
            createdByUserId: user.id,
            createdByName: user.name,
          });
          existingNames.add(nameKey);
          importedCases++;
        } catch (e) {
          errors.push(`Case ${c.client}: ${(e as Error).message}`);
          skippedCases++;
        }
      }

      // Import legacy results and tasks directly into the store
      const store = await readStore();
      
      // Merge results (avoid duplicates by id)
      const existingResultIds = new Set((store.legacyResults || []).map((r: any) => r.id));
      const newResults = oldResults.filter((r: any) => r.id && !existingResultIds.has(r.id));
      store.legacyResults = [...(store.legacyResults || []), ...newResults];
      importedResults = newResults.length;

      // Merge tasks
      const existingTaskIds = new Set((store.tasks || []).map((t: any) => t.id));
      const newTasks = oldTasks.filter((t: any) => t.id && !existingTaskIds.has(t.id));
      store.tasks = [...(store.tasks || []), ...newTasks];
      importedTasks = newTasks.length;

      await writeStore(store);
    } else {
      // Dry run counts
      for (const c of oldCases) {
        if (!c.client?.trim()) { skippedCases++; continue; }
        if (existingIds.has(c.id)) { skippedCases++; continue; }
        const nameKey = c.client.toLowerCase().trim().split(/\s+/).slice(0,2).join(" ");
        if (existingNames.has(nameKey)) { skippedCases++; continue; }
        importedCases++;
      }
      importedResults = oldResults.length;
      importedTasks = oldTasks.length;
    }

    return NextResponse.json({
      dryRun: body.dryRun || false,
      oldCRM: {
        totalCases: oldCases.length,
        totalResults: oldResults.length,
        totalTasks: oldTasks.length,
      },
      imported: { cases: importedCases, results: importedResults, tasks: importedTasks },
      skipped: skippedCases,
      errors: errors.slice(0, 20),
    });

  } catch (e) {
    return NextResponse.json({ error: `Migration failed: ${(e as Error).message}` }, { status: 500 });
  } finally {
    if (oldPool) await oldPool.end().catch(() => {});
  }
}
