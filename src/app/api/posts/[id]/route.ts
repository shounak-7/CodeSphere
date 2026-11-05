import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteLocalPost } from "@/lib/storage/communityStore";
import { deleteUserMedia, invalidateStorageCache } from "@/lib/server/storageQuota";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized: Please sign in to delete a post" },
      { status: 401 }
    );
  }

  const userId = user.id;
  const username =
    (user.user_metadata?.user_name as string) ||
    (user.user_metadata?.username as string) ||
    user.email?.split("@")[0];

  let deletedFromSupabase = false;
  try {
    const admin = createAdminClient();
    // 1. Fetch post to check if it has media attached before deleting
    const { data: existingPost } = await admin
      .from("posts")
      .select("id, content, author_id")
      .eq("id", id)
      .eq("author_id", userId)
      .maybeSingle();

    if (existingPost) {
      const mediaMatch = (existingPost.content || "").match(/<!--media:(.+?)-->/);
      if (mediaMatch && mediaMatch[1]) {
        await deleteUserMedia(userId, mediaMatch[1]);
      }

      const { data, error } = await admin
        .from("posts")
        .delete()
        .eq("id", id)
        .eq("author_id", userId)
        .select("id");

      if (!error && data && data.length > 0) {
        deletedFromSupabase = true;
      }
    }
  } catch (err) {
    console.warn("Supabase post delete error, proceeding with local check:", err);
  }

  const result = await deleteLocalPost(id, userId, username);
  if (!deletedFromSupabase && !result.success) {
    return NextResponse.json(
      { error: result.error || "You are not authorized to delete this post" },
      { status: 403 }
    );
  }

  invalidateStorageCache(userId);

  return NextResponse.json({ success: true, deletedId: id });
}
