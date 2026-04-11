import { NextRequest, NextResponse } from "next/server";
import { mapIntakeToImm5710 } from "@/lib/imm5710-mapper";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCase, addDocument } from "@/lib/store";
import { buildS3ObjectKey, putObjectToS3, toS3StoredLink, isS3StorageEnabled } from "@/lib/object-storage";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// Which forms to generate per application type
const FORM_MAP: Record<string, string[]> = {
  "post-graduation work permit": ["imm5710"],
  "pgwp": ["imm5710"],
  "spousal open work permit": ["imm5710"],
  "sowp": ["imm5710"],
  "bridging open work permit": ["imm5710"],
  "bowp": ["imm5710"],
  "open work permit": ["imm5710"],
  "lmia-based work permit": ["imm5710"],
  "lmia-exempt work permit": ["imm5710"],
  "vulnerable open work permit": ["imm5710"],
  "visitor record": ["imm5708"],
  "visitor visa": ["imm5257"],
  "trv": ["imm5257"],
  "study permit": ["imm5709"],
  "study permit extension": ["imm5709"],
  "restoration": ["imm5710"],
};

function getFormsForType(formType: string): string[] {
  const ft = formType.toLowerCase().trim();
  for (const [key, forms] of Object.entries(FORM_MAP)) {
    if (ft.includes(key) || key.includes(ft)) return forms;
  }
  return [];
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Allow both staff and system (from questionnaire completion)
  const user = await getCurrentUserFromRequest(request).catch(() => null);
  const body = await request.json().catch(() => ({}));
  const isSystemCall = body.systemToken === (process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024");
  if (!user && !isSystemCall) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = user?.companyId || process.env.DEFAULT_COMPANY_ID || "newton";
  const caseItem = await getCase(companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const intake = body.intake || (caseItem as any).pgwpIntake || {};
  const formType = caseItem.formType || "";
  const forms = getFormsForType(formType);

  if (!forms.length) {
    return NextResponse.json({ ok: true, message: `No forms configured for ${formType}`, generated: [] });
  }

  const generated: string[] = [];
  const tmpDir = join(tmpdir(), `forms-${params.id}-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  for (const formId of forms) {
    try {
      // Write Python script inline to temp dir
      const scriptPath = join(tmpDir, `run_${formId}.py`);
      const outputPath = join(tmpDir, `${formId}_${params.id}.pdf`);
      const blankPath = join(process.cwd(), "public", "forms", `${formId}e.pdf`);

      // Map CRM intake to form fields using TypeScript mapper
      let mappedData: Record<string, any> = {};
      if (formId === "imm5710") {
        mappedData = mapIntakeToImm5710(intake, caseItem.formType);
      } else {
        mappedData = intake; // fallback for other forms
      }

      const pythonScript = `
import sys, json
sys.path.insert(0, '${process.cwd()}/lib/python')
from fill_${formId} import fill_${formId}, EMPTY_CLIENT

mapped = json.loads(sys.argv[1])
client_data = {**EMPTY_CLIENT, **mapped}
fill_${formId}(client_data, '${blankPath}', '${outputPath}')
`;
      await writeFile(scriptPath, pythonScript);

      const mappedJson = JSON.stringify(mappedData).replace(/'/g, "\\'");
      await execAsync(`python3 ${scriptPath} '${mappedJson}'`);

      // Read output and upload to S3 / save as document
      const pdfBuffer = await readFile(outputPath);
      const fileName = `${formId.toUpperCase()}_${caseItem.client.replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`;

      let fileLink = "";
      if (isS3StorageEnabled()) {
        const key = buildS3ObjectKey({ companyId, caseId: params.id, fileName });
        await putObjectToS3({ key, content: pdfBuffer, contentType: "application/pdf" });
        fileLink = toS3StoredLink(key);
      }

      // Save as document in case
      await addDocument({
        companyId,
        caseId: params.id,
        name: `${formId.toUpperCase()} - Auto-filled`,
        category: "application_form",
        status: "generated",
        link: fileLink,
      });

      generated.push(formId);
      await unlink(outputPath).catch(() => {});
      await unlink(scriptPath).catch(() => {});
    } catch (e) {
      console.error(`Form generation failed for ${formId}:`, (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true, generated, caseId: params.id });
}
