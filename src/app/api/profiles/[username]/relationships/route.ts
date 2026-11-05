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
import { getVerifiedEntities, checkIsVerified } from "@/lib/server/verification";

const usernameToIdMap = new Map<string, string>();

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
  const normalizedUsername = targetUsername.toLowerCase();

  try {
    const admin = createAdminClient();
    // 1. Resolve target user's Supabase ID (using fast in-memory cache if available)
    let targetProfileId: string | null = null;
    if (username === "me" && currentUserId) {
      targetProfileId = currentUserId;
      if (currentUsername) usernameToIdMap.set(currentUsername.toLowerCase(), currentUserId);
    } else if (usernameToIdMap.has(normalizedUsername)) {
      targetProfileId = usernameToIdMap.get(normalizedUsername)!;
    } else {
      const { data: tp } = await admin
        .from("profiles")
        .select("id")
        .ilike("username", targetUsername)
        .maybeSingle();
      if (tp?.id) {
        targetProfileId = tp.id;
        usernameToIdMap.set(normalizedUsername, tp.id);
      }
    }

    if (targetProfileId) {
      // 2. Fetch raw follows rows and verified entities in parallel (much faster than PostgREST join)
      const [followersRes, followingRes, myFollowingRes, verifiedData] = await Promise.all([
        admin.from("follows").select("follower_id").eq("following_id", targetProfileId),
        admin.from("follows").select("following_id").eq("follower_id", targetProfileId),
        currentUserId
          ? admin.from("follows").select("following_id").eq("follower_id", currentUserId)
          : Promise.resolve({ data: [] }),
        getVerifiedEntities(),
      ]);

      const followerIds = ((followersRes.data || []) as { follower_id: string }[]).map((r) => r.follower_id);
      const followingIds = ((followingRes.data || []) as { following_id: string }[]).map((r) => r.following_id);
      const allUserIds = Array.from(new Set([...followerIds, ...followingIds]));

      // 3. Batch lookup profile info for all connected users in a single indexed query
      let profileMap = new Map<string, any>();
      if (allUserIds.length > 0) {
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio")
          .in("id", allUserIds);

        (profiles || []).forEach((p) => {
          profileMap.set(p.id, p);
          if (p.username) usernameToIdMap.set(p.username.toLowerCase(), p.id);
        });
      }

      const myFollowingSet = new Set(
        ((myFollowingRes?.data || []) as { following_id: string }[]).map((f) => f.following_id)
      );

      const followers = followerIds
        .map((id) => profileMap.get(id))
        .filter(Boolean)
        .map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name || u.username,
          avatar_url: u.avatar_url || "",
          bio: u.bio || "",
          is_following: myFollowingSet.has(u.id),
          is_self: currentUserId === u.id,
          is_verified: checkIsVerified(u, verifiedData),
        }));

      const following = followingIds
        .map((id) => profileMap.get(id))
        .filter(Boolean)
        .map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name || u.username,
          avatar_url: u.avatar_url || "",
          bio: u.bio || "",
          is_following: myFollowingSet.has(u.id),
          is_self: currentUserId === u.id,
          is_verified: checkIsVerified(u, verifiedData),
        }));

      return NextResponse.json(
        { followers, following },
        {
          headers: {
            "Cache-Control": "private, max-age=10, stale-while-revalidate=60",
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
