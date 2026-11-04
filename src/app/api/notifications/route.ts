import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markAllLocalNotificationsRead,
  deleteLocalNotification,
  clearLocalNotifications,
  getLocalNotifications,
  isUserVerified,
} from "@/lib/storage/communityStore";
import { isTeamAccount } from "@/lib/utils";

async function resolveCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, userId: null, username: null };
  }

  const username =
    (user.user_metadata?.user_name as string) ||
    (user.user_metadata?.username as string) ||
    user.email?.split("@")[0] ||
    "developer";

  return { user, userId: user.id, username };
}

export async function GET() {
  const { user, userId, username } = await resolveCurrentUser();

  if (!user || !userId) {
    return NextResponse.json({ notifications: [] });
  }

  try {
    const supabase = await createClient();
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url)
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && notifications && notifications.length > 0) {
      // Collect post ids and comment post ids to enrich notifications
      const postIds = Array.from(new Set(notifications.map((n) => n.reference_id).filter(Boolean)));
      const commentNotifs = notifications.filter((n) => n.notification_type === "comment");
      const commentPostIds = Array.from(new Set(commentNotifs.map((n) => n.reference_id).filter(Boolean)));

      const [postsRes, commentsRes] = await Promise.all([
        postIds.length > 0
          ? supabase.from("posts").select("id, title, content").in("id", postIds)
          : Promise.resolve({ data: [] }),
        commentPostIds.length > 0
          ? supabase.from("comments").select("id, post_id, author_id, content, created_at").in("post_id", commentPostIds)
          : Promise.resolve({ data: [] }),
      ]);

      const postMap = new Map((postsRes.data || []).map((p: any) => [p.id, p]));
      const allComments: any[] = commentsRes.data || [];

      const enriched = notifications.map((n) => {
        const post = n.reference_id ? postMap.get(n.reference_id) : null;
        let postTitle = post ? (post.title || (post.content ? post.content.slice(0, 40) : "")) : undefined;
        let commentText = undefined;

        if (n.notification_type === "comment" && n.reference_id) {
          // Find matching comment by author and post
          const matches = allComments.filter(
            (c) => c.post_id === n.reference_id && (n.actor_id ? c.author_id === n.actor_id : true)
          );
          if (matches.length > 0) {
            // Sort by closest creation time to the notification
            const notifTime = new Date(n.created_at).getTime();
            matches.sort((a, b) => {
              const diffA = Math.abs(new Date(a.created_at).getTime() - notifTime);
              const diffB = Math.abs(new Date(b.created_at).getTime() - notifTime);
              return diffA - diffB;
            });
            commentText = matches[0].content;
          }
        }

        return {
          ...n,
          actor: n.actor
            ? {
                ...n.actor,
                is_verified:
                  Boolean(n.actor.is_verified) ||
                  isTeamAccount(n.actor.username) ||
                  isUserVerified(n.actor.username),
              }
            : undefined,
          post_title: postTitle,
          comment_text: commentText,
        };
      });

      return NextResponse.json(
        { notifications: enriched },
        { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" } }
      );
    }
  } catch (err) {
    console.warn("Supabase notifications fetch error:", err);
  }

  try {
    const local = await getLocalNotifications(userId, username || undefined);
    return NextResponse.json(
      { notifications: local },
      { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" } }
    );
  } catch {}

  return NextResponse.json({ notifications: [] });
}

export async function PUT() {
  const { user, userId, username } = await resolveCurrentUser();

  if (!user || !userId) {
    return NextResponse.json({ success: true });
  }

  try {
    const admin = createAdminClient();
    await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
  } catch (err) {
    console.warn("Supabase mark notifications read error:", err);
  }

  try {
    await markAllLocalNotificationsRead(userId, username || undefined);
  } catch {}
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const all = searchParams.get("all") === "true";

  const { user, userId, username } = await resolveCurrentUser();

  if (!user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    if (all) {
      await admin.from("notifications").delete().eq("recipient_id", userId);
      try {
        await clearLocalNotifications(userId, username || undefined);
      } catch {}
      return NextResponse.json({ success: true, cleared: true });
    } else if (id) {
      await admin.from("notifications").delete().eq("id", id).eq("recipient_id", userId);
      try {
        await deleteLocalNotification(id, userId, username || undefined);
      } catch {}
      return NextResponse.json({ success: true, deletedId: id });
    }
  } catch (err) {
    console.warn("Supabase delete notification error:", err);
  }

  return NextResponse.json({ error: "Notification not found" }, { status: 404 });
}
