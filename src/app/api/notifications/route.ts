import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLocalNotifications,
  markAllLocalNotificationsRead,
  deleteLocalNotification,
  clearLocalNotifications,
  getLocalProfile,
} from "@/lib/storage/communityStore";

async function resolveCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, userId: null, username: null };
  }

  const profile = await getLocalProfile(user.id);
  const username =
    profile?.username ||
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
      return NextResponse.json({ notifications });
    }
  } catch (err) {
    console.warn("Supabase notifications fetch error:", err);
  }

  const localNotifications = await getLocalNotifications(userId, username || undefined);
  return NextResponse.json({ notifications: localNotifications });
}

export async function PUT() {
  const { user, userId, username } = await resolveCurrentUser();

  if (!user || !userId) {
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);
  } catch (err) {
    console.warn("Supabase mark notifications read error:", err);
  }

  await markAllLocalNotificationsRead(userId, username || undefined);
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

  const supabase = await createClient();

  if (all) {
    try {
      await supabase.from("notifications").delete().eq("recipient_id", userId);
    } catch (err) {
      console.warn("Supabase clear notifications error:", err);
    }
    await clearLocalNotifications(userId, username || undefined);
    return NextResponse.json({ success: true, cleared: true });
  }

  if (id) {
    try {
      await supabase.from("notifications").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase delete notification error:", err);
    }
    await deleteLocalNotification(id, userId, username || undefined);
    return NextResponse.json({ success: true, deletedId: id });
  }

  return NextResponse.json({ error: "Missing notification id or all flag" }, { status: 400 });
}
