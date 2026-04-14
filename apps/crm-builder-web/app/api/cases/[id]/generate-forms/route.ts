import { NextRequest, NextResponse } from "next/server";
import { mapIntakeToImm5710 } from "@/lib/imm5710-mapper";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCase, addDocument } from "@/lib/store";
import { buildS3ObjectKey, putObjectToS3, toS3StoredLink, isS3StorageEnabled } from "@/lib/object-storage";
import { uploadFileToDriveFolder } from "@/lib/google-drive";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// Which forms to generate per application type
const FORM_MAP: Record<string, string[]> = {
  "post-graduation work permit": ["imm5710", "imm5476", "rep_letter"],
  "pgwp": ["imm5710", "imm5476", "rep_letter"],
  "spousal open work permit": ["imm5710", "imm5476", "rep_letter"],
  "sowp": ["imm5710", "imm5476", "rep_letter"],
  "bridging open work permit": ["imm5710", "imm5476", "rep_letter"],
  "bowp": ["imm5710", "imm5476", "rep_letter"],
  "open work permit": ["imm5710", "imm5476", "rep_letter"],
  "lmia-based work permit": ["imm5710", "imm5476", "rep_letter"],
  "lmia-exempt work permit": ["imm5710", "imm5476", "rep_letter"],
  "vulnerable open work permit": ["imm5710", "imm5476", "rep_letter"],
  "visitor record": ["imm5708", "imm5476", "rep_letter"],
  "visitor visa": ["imm5257", "imm5476", "rep_letter"],
  "trv": ["imm5257", "imm5476", "rep_letter"],
  "study permit": ["imm5709", "imm5476", "rep_letter"],
  "study permit extension": ["imm5709", "imm5476", "rep_letter"],
  "restoration": ["imm5710", "imm5476", "rep_letter"],
  // Types that get rep letter + imm5476 only (no standard IRCC fill form)
  "super visa": ["imm5476", "rep_letter"],
  "supervisa": ["imm5476", "rep_letter"],
  "express entry": ["imm5476", "rep_letter"],
  "pnp": ["imm5476", "rep_letter"],
  "family sponsorship": ["imm5476", "rep_letter"],
  "spousal sponsorship": ["imm5476", "rep_letter"],
  "citizenship": ["imm5476", "rep_letter"],
  "pr card": ["imm5476", "rep_letter"],
  "trv inside": ["imm5257", "imm5476", "rep_letter"],
  "refugee": ["imm5476", "rep_letter"],
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

      // Map CRM intake to form fields
      let mappedData: Record<string, any> = {};
      if (formId === "imm5710") {
        mappedData = mapIntakeToImm5710(intake, caseItem.formType);
      } else if (formId === "imm5476") {
        // IMM5476 uses client name + RCIC details
        const nameParts = (caseItem.client || "").trim().split(" ");
        mappedData = {
          family_name: nameParts.slice(1).join(" ") || nameParts[0],
          given_name: nameParts[0],
          dob: intake.dob || intake.date_of_birth || "",
          passport_number: intake.passport_number || intake.passportNumber || "",
          uci: intake.uci || intake.uciNumber || "",
        };
      } else if (formId === "rep_letter") {
        // Representative letter
        const intake_data = intake || {};
        mappedData = {
          client_name: caseItem.client || "",
          form_type: caseItem.formType || "",
          passport_number: intake_data.passport_number || intake_data.passportNumber || "",
          arrival_date: intake_data.arrival_date || intake_data.originalEntryDate || intake_data.date_entered_canada || "",
          institution: intake_data.institution || intake_data.school_name || intake_data.institutionName || "",
          program: intake_data.program || intake_data.field_of_study || intake_data.programOfStudy || "",
          uci: intake_data.uci || "",
        };
      } else {
        mappedData = intake;
      }

      // Python script varies by form type
      const pythonModule = formId === "rep_letter" ? "generate_rep_letter" : `fill_${formId}`;
      const pythonFunc = formId === "rep_letter" ? "generate_rep_letter" : `fill_${formId}`;
      const needsBlank = !["rep_letter"].includes(formId);

      const pythonScript = formId === "rep_letter" ? `
import sys, json
sys.path.insert(0, '${process.cwd()}/lib/python')
from generate_rep_letter import generate_rep_letter

mapped = json.loads(sys.argv[1])
generate_rep_letter(mapped, '${outputPath}')
` : `
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
      // File naming: [Client Name]- [Document Name].pdf per Newton Immigration convention
      const clientNameClean = (caseItem.client || "Client").replace(/[^a-zA-Z0-9 ]/g, "").trim();
      const formLabels: Record<string, string> = {
        imm5710: "imm5710e",
        imm5476: "imm5476e", 
        imm5257: "imm5257e",
        imm5708: "imm5708e",
        imm5709: "imm5709e",
        rep_letter: "Representative Letter",
      };
      const formLabel = formLabels[formId] || formId.toUpperCase();
      const fileName = `${clientNameClean}- ${formLabel}.pdf`;

      let fileLink = "";
      if (isS3StorageEnabled()) {
        const key = buildS3ObjectKey({ companyId, caseId: params.id, fileName });
        await putObjectToS3({ key, content: pdfBuffer, contentType: "application/pdf" });
        fileLink = toS3StoredLink(key);
      }

      // Upload to Google Drive folder if case has one
      let driveLink = fileLink;
      try {
        const driveFolderId = (caseItem as any).driveFolderId || (caseItem as any).driveApplicationFolderId;
        if (driveFolderId) {
          const driveResult = await uploadFileToDriveFolder({
            folderId: driveFolderId,
            fileName: fileName,
            fileBuffer: pdfBuffer,
            mimeType: "application/pdf"
          });
          if (driveResult?.webViewLink) {
            driveLink = driveResult.webViewLink;
            console.log(`📁 Form uploaded to Drive: ${fileName} → ${driveResult.webViewLink}`);
          }
        }
      } catch (driveErr) {
        console.error("Drive upload failed (non-fatal):", (driveErr as Error).message);
      }

      // Save as document in case
      await addDocument({
        companyId,
        caseId: params.id,
        name: `${formId.toUpperCase()} - Auto-filled`,
        category: "application_form",
        status: "generated",
        link: driveLink || fileLink,
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
