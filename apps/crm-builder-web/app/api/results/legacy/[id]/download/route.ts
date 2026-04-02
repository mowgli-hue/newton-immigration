import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { fromS3StoredLink, getSignedDownloadUrl, isS3StoredLink } from "@/lib/object-storage";
import { listLegacyResults } from "@/lib/store";

function safeFileName(name: string) {
  const cleaned = String(name || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 140);
  return cleaned || "result.pdf";
}

function detectContentTypeFromPath(path: string) {
  const lower = String(path || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.userType === "client" || user.role === "Client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await listLegacyResults(user.companyId);
  const item = items.find((r) => r.id === params.id);
  if (!item) return NextResponse.json({ error: "Result not found" }, { status: 404 });
  if (!item.fileLink) return NextResponse.json({ error: "No file attached" }, { status: 404 });

  const downloadName = safeFileName(item.fileName || `result_${item.applicationNumber}.pdf`);
  const link = String(item.fileLink || "").trim();

  if (isS3StoredLink(link)) {
    const key = fromS3StoredLink(link);
    if (!key) return NextResponse.json({ error: "Invalid storage key" }, { status: 400 });
    const signed = await getSignedDownloadUrl({
      key,
      expiresInSeconds: Number(process.env.S3_SIGNED_URL_EXPIRES || 300)
    });
    try {
      const upstream = await fetch(signed, { cache: "no-store" });
      if (!upstream.ok) {
        return NextResponse.json(
          {
            error: "Stored file is missing from object storage",
            storageKey: key,
            status: upstream.status
          },
          { status: 404 }
        );
      }
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            String(upstream.headers.get("content-type") || "").trim() ||
            detectContentTypeFromPath(downloadName),
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          "Cache-Control": "private, no-store"
        }
      });
    } catch {
      return NextResponse.json({ error: "Could not read file from object storage" }, { status: 502 });
    }
  }

  if (link.startsWith("/uploads/")) {
    const relative = link.replace(/^\/+/, "");
    const fullPath = join(process.cwd(), "public", relative);
    try {
      const buffer = await readFile(fullPath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": detectContentTypeFromPath(fullPath),
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          "Cache-Control": "private, no-store"
        }
      });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  }

  if (link.startsWith("http://") || link.startsWith("https://")) {
    try {
      const upstream = await fetch(link, { cache: "no-store" });
      if (!upstream.ok) {
        return NextResponse.json(
          { error: "Remote file is unavailable", status: upstream.status },
          { status: 404 }
        );
      }
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            String(upstream.headers.get("content-type") || "").trim() ||
            detectContentTypeFromPath(downloadName),
          "Content-Disposition": `attachment; filename="${downloadName}"`,
          "Cache-Control": "private, no-store"
        }
      });
    } catch {
      return NextResponse.json({ error: "Could not read remote file" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "Unsupported file link type" }, { status: 400 });
}
