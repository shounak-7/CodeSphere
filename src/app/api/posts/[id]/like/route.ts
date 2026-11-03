import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleLocalLike } from "@/lib/storage/communityStore";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to like posts." },
      { status: 401 }
    );
  }

  const userId = user.id;
  const userMeta = {
    username:
      (user?.user_metadata?.user_name as string) ||
      (user?.user_metadata?.username as string) ||
      user?.email?.split("@")[0] ||
      "user",
    full_name:
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      "CodeSphere Member",
    avatar_url:
      (user?.user_metadata?.avatar_url as string) ||
      (user?.user_metadata?.picture as string) ||
      "",
  };

  // Always update persistent local store with actor meta
  const { liked, count } = await toggleLocalLike(postId, userId, userMeta);
  let finalLiked = liked;
  let finalCount = count;

  // Sync to Supabase if logged in
  if (user) {
    try {
      const { data: existingLike } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingLike && !liked) {
        await supabase.from("post_likes").delete().eq("id", existingLike.id);
      } else if (!existingLike && liked) {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      }

      // Query exact live like count from Supabase
      const { count: supaLikesCount } = await supabase
        .from("post_likes")
        .select("id", { count: "exact" })
        .eq("post_id", postId);

      if (supaLikesCount !== null && supaLikesCount !== undefined && supaLikesCount > 0) {
        finalCount = supaLikesCount;
      }
    } catch (err) {
      console.warn("Supabase like sync error:", err);
    }
  }

  return NextResponse.json({ liked: finalLiked, count: finalCount });
}
