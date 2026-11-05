import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserStorageUsage } from "@/lib/server/storageQuota";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usage = await getUserStorageUsage(user.id);
    return NextResponse.json(
      { usage },
      { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compute storage quota" },
      { status: 500 }
    );
  }
}
