import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markAllLocalNotificationsRead,
  deleteLocalNotification,
  clearLocalNotifications,
} from "@/lib/storage/communityStore";

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

    if (!error && notifications) {
      return NextResponse.json({ notifications });
    }
  } catch (err) {
    console.warn("Supabase notifications fetch error:", err);
  }

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
    }

    if (id) {
      await admin.from("notifications").delete().eq("id", id).eq("recipient_id", userId);
      try {
        await deleteLocalNotification(id, userId, username || undefined);
      } catch {}
      return NextResponse.json({ success: true, deletedId: id });
    }
  } catch (err) {
    console.warn("Supabase delete notification error:", err);
  }

  return NextResponse.json({ error: "Missing notification id or all flag" }, { status: 400 });
}
