import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getLocalRelationships,
  removeLocalFollower,
  toggleLocalFollow,
  getLocalProfile,
  isUserVerified,
} from "@/lib/storage/communityStore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const currentUserId = currentUser ? currentUser.id : undefined;
  const currentUsername = currentUser
    ? (currentUser.user_metadata?.user_name as string) ||
      (currentUser.user_metadata?.username as string) ||
      currentUser.email?.split("@")[0]
    : undefined;

  const targetUsername = username === "me" ? currentUsername || "codesphere" : username;

  try {
    // 1. Resolve target user's Supabase ID
    let targetProfileId: string | null = null;
    if (username === "me" && currentUserId) {
      targetProfileId = currentUserId;
    } else {
      const { data: tp } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", targetUsername)
        .maybeSingle();
      targetProfileId = tp?.id || null;
    }

    if (targetProfileId) {
      // 2. Fetch followers, following, and current user's following list in parallel
      const [followersRes, followingRes, myFollowingRes] = await Promise.all([
        supabase
          .from("follows")
          .select(`
            follower:profiles!follows_follower_id_fkey(id, username, full_name, avatar_url, bio)
          `)
          .eq("following_id", targetProfileId),
        supabase
          .from("follows")
          .select(`
            following:profiles!follows_following_id_fkey(id, username, full_name, avatar_url, bio)
          `)
          .eq("follower_id", targetProfileId),
        currentUserId
          ? supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", currentUserId)
          : Promise.resolve({ data: [] }),
      ]);

      const myFollowingSet = new Set(
        ((myFollowingRes?.data || []) as { following_id: string }[]).map((f) => f.following_id)
      );

      const followers = ((followersRes.data || []) as any[])
        .map((row) => row.follower)
        .filter(Boolean)
        .map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name || u.username,
          avatar_url: u.avatar_url || "",
          bio: u.bio || "",
          is_following: myFollowingSet.has(u.id),
          is_self: currentUserId === u.id,
          is_verified: isUserVerified(u.username),
        }));

      const following = ((followingRes.data || []) as any[])
        .map((row) => row.following)
        .filter(Boolean)
        .map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name || u.username,
          avatar_url: u.avatar_url || "",
          bio: u.bio || "",
          is_following: myFollowingSet.has(u.id),
          is_self: currentUserId === u.id,
          is_verified: isUserVerified(u.username),
        }));

      return NextResponse.json(
        { followers, following },
        {
          headers: {
            "Cache-Control": "private, max-age=5, stale-while-revalidate=15",
          },
        }
      );
    }
  } catch (err) {
    console.warn("Supabase relationships fetch failed, using local store:", err);
  }

  const data = await getLocalRelationships(username, currentUserId, currentUsername);
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const currentUserId = currentUser?.id || "default-user";
  const currentUsername =
    (currentUser?.user_metadata?.user_name as string) ||
    (currentUser?.user_metadata?.username as string) ||
    currentUser?.email?.split("@")[0] ||
    "developer";

  try {
    const json = await request.json();
    const { action, targetUsername } = json;

    if (!targetUsername) {
      return NextResponse.json({ error: "Missing targetUsername" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Remove follower action: removes target from the owner's followers list
    if (action === "remove_follower") {
      const ownerUsername = username === "me" ? currentUsername : username;
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", ownerUsername)
        .maybeSingle();
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", targetUsername)
        .maybeSingle();

      if (ownerProfile?.id && targetProfile?.id) {
        try {
          await admin
            .from("follows")
            .delete()
            .eq("follower_id", targetProfile.id)
            .eq("following_id", ownerProfile.id);
        } catch (err) {
          console.warn("Supabase remove follower warning:", err);
        }
      }

      const ownerObj = {
        id: ownerProfile?.id || currentUserId,
        username: ownerUsername,
      };
      const targetObj = {
        id: targetProfile?.id || `user-${targetUsername}`,
        username: targetUsername,
      };
      const result = await removeLocalFollower(ownerObj, targetObj);
      return NextResponse.json({ success: true, followersCount: result.followersCount });
    }

    // 2. Unfollow action: current user unfollows target
    if (action === "unfollow") {
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", targetUsername)
        .maybeSingle();

      if (currentUser && targetProfile?.id) {
        try {
          await admin
            .from("follows")
            .delete()
            .eq("follower_id", currentUser.id)
            .eq("following_id", targetProfile.id);
        } catch (err) {
          console.warn("Supabase unfollow warning:", err);
        }
      }

      const followerObj = {
        id: currentUserId,
        username: currentUsername,
      };
      const targetObj = {
        id: targetProfile?.id || `user-${targetUsername}`,
        username: targetUsername,
      };
      const result = await toggleLocalFollow(followerObj, targetObj);
      return NextResponse.json({ success: true, following: result.following });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process relationship update" },
      { status: 500 }
    );
  }
}
