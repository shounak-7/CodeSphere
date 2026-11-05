import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cleanupOrphanedFiles, getUserStorageUsage } from "@/lib/server/storageQuota";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { deletedCount, freedBytes } = await cleanupOrphanedFiles(user.id);
    const updatedUsage = await getUserStorageUsage(user.id);

    return NextResponse.json({
      success: true,
      deletedCount,
      freedBytes,
      usage: updatedUsage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to run storage cleanup" },
      { status: 500 }
    );
  }
}
