import { NextResponse } from "next/server";
import { getLatestImmigrationNews } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getLatestImmigrationNews();
  return NextResponse.json({ items, count: items.length, updatedAt: new Date().toISOString() });
}
