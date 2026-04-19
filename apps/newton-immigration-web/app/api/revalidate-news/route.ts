import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (body.token !== (process.env.AUTH_RECOVERY_TOKEN || "newton-recovery-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  revalidatePath("/immigration-news");
  revalidatePath("/");
  revalidatePath("/blog");
  
  console.log("✅ News pages revalidated");
  return NextResponse.json({ ok: true, revalidated: true, at: new Date().toISOString() });
}
