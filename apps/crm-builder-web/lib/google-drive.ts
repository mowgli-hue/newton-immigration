import { createSign } from "node:crypto";

type DriveFolderResult = {
  id: string;
  webViewLink: string;
};

type DriveFileResult = {
  id: string;
  webViewLink: string;
};

type CaseDriveStructureResult = {
  caseFolder: DriveFolderResult;
  subfolders: {
    clientDocuments: DriveFolderResult;
    applicationForms: DriveFolderResult;
    submitted: DriveFolderResult;
    correspondence: DriveFolderResult;
  };
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getServiceAccount() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  if (!email || !privateKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  }
  return { email, privateKey };
}

async function getDriveAccessToken(): Promise<string> {
  const { email, privateKey } = getServiceAccount();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const params = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token request failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google access token missing");
  return json.access_token;
}

export function extractDriveFolderId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  const idPattern = /[-\w]{25,}/;
  if (!value.includes("http")) return idPattern.test(value) ? value : null;

  const byFolders = value.match(/\/folders\/([-\w]{25,})/);
  if (byFolders?.[1]) return byFolders[1];

  const byIdParam = value.match(/[?&]id=([-\w]{25,})/);
  if (byIdParam?.[1]) return byIdParam[1];

  const generic = value.match(idPattern);
  return generic?.[0] || null;
}

function sanitizeFolderName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

export function buildCaseFolderName(caseId: string, client: string) {
  return sanitizeFolderName(`${caseId} - ${client || "Client"}`);
}

function sanitizeAppType(input: string): string {
  return sanitizeFolderName(String(input || "").replace(/\s+/g, " ").trim());
}

export function buildCaseFolderNameWithApp(caseId: string, client: string, formType: string) {
  const app = sanitizeAppType(formType);
  if (!app) return buildCaseFolderName(caseId, client);
  return sanitizeFolderName(`${caseId} - ${client || "Client"} - ${app}`);
}

const CASE_SUBFOLDER_NAMES = {
  clientDocuments: "Client Documents",
  applicationForms: "Application Forms",
  submitted: "Submitted",
  correspondence: "Correspondence"
} as const;

export async function createDriveSubfolder(parentFolderId: string, folderName: string): Promise<DriveFolderResult> {
  const accessToken = await getDriveAccessToken();

  const res = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId]
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive folder create failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: string; webViewLink?: string };
  if (!data.id) throw new Error("Google Drive folder id missing");
  return {
    id: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`
  };
}

async function findDriveSubfolderByName(parentFolderId: string, folderName: string): Promise<DriveFolderResult | null> {
  const accessToken = await getDriveAccessToken();
  const safeName = String(folderName || "").replace(/'/g, "\\'");
  const q = [
    "mimeType='application/vnd.google-apps.folder'",
    "trashed=false",
    `'${parentFolderId}' in parents`,
    `name='${safeName}'`
  ].join(" and ");
  const url =
    "https://www.googleapis.com/drive/v3/files?" +
    new URLSearchParams({
      q,
      fields: "files(id,name,webViewLink,createdTime)",
      pageSize: "1",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      orderBy: "createdTime desc"
    }).toString();
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { files?: Array<{ id: string; webViewLink?: string }> };
  const match = data.files?.[0];
  if (!match?.id) return null;
  return {
    id: match.id,
    webViewLink: match.webViewLink || `https://drive.google.com/drive/folders/${match.id}`
  };
}

export async function getOrCreateDriveSubfolder(parentFolderId: string, folderName: string): Promise<DriveFolderResult> {
  const existing = await findDriveSubfolderByName(parentFolderId, folderName);
  if (existing) return existing;
  return createDriveSubfolder(parentFolderId, folderName);
}

export async function createCaseDriveStructure(
  rootFolderId: string,
  caseFolderName: string
): Promise<CaseDriveStructureResult> {
  const caseFolder = await getOrCreateDriveSubfolder(rootFolderId, caseFolderName);
  const [clientDocuments, applicationForms, submitted, correspondence] = await Promise.all([
    getOrCreateDriveSubfolder(caseFolder.id, CASE_SUBFOLDER_NAMES.clientDocuments),
    getOrCreateDriveSubfolder(caseFolder.id, CASE_SUBFOLDER_NAMES.applicationForms),
    getOrCreateDriveSubfolder(caseFolder.id, CASE_SUBFOLDER_NAMES.submitted),
    getOrCreateDriveSubfolder(caseFolder.id, CASE_SUBFOLDER_NAMES.correspondence)
  ]);

  return {
    caseFolder,
    subfolders: {
      clientDocuments,
      applicationForms,
      submitted,
      correspondence
    }
  };
}

export async function uploadFileToDriveFolder(input: {
  folderId: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType?: string;
}): Promise<DriveFileResult> {
  const accessToken = await getDriveAccessToken();
  const boundary = `flowdesk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const metadata = {
    name: sanitizeFolderName(input.fileName),
    parents: [input.folderId]
  };
  const mimeType = input.mimeType || "application/octet-stream";

  const preamble =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const ending = `\r\n--${boundary}--`;
  const body = Buffer.concat([
    Buffer.from(preamble, "utf8"),
    input.fileBuffer,
    Buffer.from(ending, "utf8")
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body,
      cache: "no-store"
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive file upload failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id?: string; webViewLink?: string };
  if (!data.id) throw new Error("Google Drive file id missing");
  return {
    id: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`
  };
}
