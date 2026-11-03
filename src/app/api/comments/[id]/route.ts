import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteLocalComment } from "@/lib/storage/communityStore";

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
      { error: "Unauthorized: Please sign in to delete a comment" },
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
    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id)
      .eq("author_id", userId)
      .select("id");
    if (!error && data && data.length > 0) {
      deletedFromSupabase = true;
    }
  } catch (err) {
    console.warn("Supabase comment delete error, proceeding with local check:", err);
  }

  const result = await deleteLocalComment(id, userId, username);
  if (!deletedFromSupabase && !result.success) {
    return NextResponse.json(
      { error: result.error || "You are not authorized to delete this comment" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, deletedId: id });
}
