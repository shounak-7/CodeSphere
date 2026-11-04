import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Try Supabase first if authenticated
  if (user) {
    try {
      // Ensure user profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const emailPrefix = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "coder";
        const username = user.user_metadata?.username || `${emailPrefix}_${user.id.substring(0, 5)}`;
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || emailPrefix;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

        await supabase.from("profiles").upsert({
          id: user.id,
          username,
          full_name: fullName,
          avatar_url: avatarUrl,
        });
      }

      const { data: existingLike } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      let liked = false;
      if (existingLike) {
        await supabase.from("post_likes").delete().eq("id", existingLike.id);
        liked = false;
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
        liked = true;

        // Notify post author if liked by someone else
        const { data: currentPost } = await supabase
          .from("posts")
          .select("author_id")
          .eq("id", postId)
          .single();

        if (currentPost && currentPost.author_id !== user.id) {
          const admin = createAdminClient();
          await admin.from("notifications").insert({
            recipient_id: currentPost.author_id,
            actor_id: user.id,
            notification_type: "like",
            reference_id: postId,
            is_read: false,
          });

          // Real-time broadcast dispatch
          try {
            const channel = admin.channel(`user-notifications-${currentPost.author_id}`);
            await channel.send({
              type: "broadcast",
              event: "new_notification",
              payload: {
                notification_type: "like",
                reference_id: postId,
                actor: userMeta,
              },
            });
          } catch {}
        }
      }

      // Query exact live like count from Supabase
      const { count: supaLikesCount } = await supabase
        .from("post_likes")
        .select("id", { count: "exact" })
        .eq("post_id", postId);

      const count = supaLikesCount ?? (liked ? 1 : 0);

      // Keep post.likes_count column updated in DB
      await supabase
        .from("posts")
        .update({ likes_count: count })
        .eq("id", postId);

      return NextResponse.json({ liked, count });
    } catch (err) {
      console.warn("Supabase like error:", err);
    }
  }

  // Fallback to local store
  const { liked, count } = await toggleLocalLike(postId, userId, userMeta);
  return NextResponse.json({ liked, count });
}
