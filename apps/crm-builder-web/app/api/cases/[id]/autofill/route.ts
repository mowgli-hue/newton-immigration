import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCase, updateCasePgwpIntake } from "@/lib/store";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const hint = String(body.hint || "");

  const caseItem = await getCase(user.companyId, params.id);
  if (!caseItem) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const existing = (caseItem.pgwpIntake as Record<string, string>) || {};

  // Build context from existing answers
  const context = Object.entries(existing)
    .filter(([k, v]) => v && !k.startsWith("whatsapp") && k !== "conversationLog")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  if (!context && !hint) {
    return NextResponse.json({ error: "No intake data to autofill from", fieldsAdded: 0 }, { status: 400 });
  }

  // Key fields to extract
  const fieldsToFill = [
    "fullName", "firstName", "lastName", "dateOfBirth", "gender",
    "maritalStatus", "spouseName", "spouseDob", "spouseDateOfMarriage",
    "address", "city", "province", "postalCode", "phone", "email",
    "passportNumber", "passportIssueDate", "passportExpiryDate",
    "countryOfBirth", "citizenship", "nativeLanguage",
    "originalEntryDate", "originalEntryPlacePurpose",
    "education", "employmentHistory", "englishTestTaken",
    "refusedAnyCountry", "criminalHistory", "medicalHistory"
  ];

  const emptyFields = fieldsToFill.filter(f => !existing[f] || existing[f].trim() === "");

  if (emptyFields.length === 0) {
    return NextResponse.json({ ok: true, fieldsAdded: 0, source: "rules", filled: {} });
  }

  try {
    const prompt = `You are an immigration data extractor. Extract the following fields from the intake answers below.

Application type: ${caseItem.formType}
Client name: ${caseItem.client}
${hint ? `Additional hint: ${hint}` : ""}

Existing intake answers:
${context || "No answers yet"}

Extract these empty fields: ${emptyFields.join(", ")}

Rules:
- Only extract what is clearly stated in the answers
- For dates use YYYY-MM-DD format
- For names use full proper case
- For address split into: address (street), city, province (2-letter code), postalCode
- If a field cannot be determined, omit it from the response
- Reply ONLY with a JSON object of field: value pairs

JSON:`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI request failed", fieldsAdded: 0 }, { status: 500 });
    }

    const data = await res.json() as any;
    const text = data.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const filled = JSON.parse(clean) as Record<string, string>;

    // Only keep non-empty values for empty fields
    const toSave: Record<string, string> = {};
    for (const [k, v] of Object.entries(filled)) {
      if (v && String(v).trim() && emptyFields.includes(k)) {
        toSave[k] = String(v).trim();
      }
    }

    if (Object.keys(toSave).length > 0) {
      await updateCasePgwpIntake(user.companyId, params.id, toSave as any);
    }

    return NextResponse.json({
      ok: true,
      fieldsAdded: Object.keys(toSave).length,
      filled: toSave,
      source: "ai"
    });

  } catch (e) {
    console.error("Autofill error:", e);
    return NextResponse.json({ error: String(e), fieldsAdded: 0 }, { status: 500 });
  }
}
