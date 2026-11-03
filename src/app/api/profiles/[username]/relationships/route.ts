import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLocalRelationships,
  removeLocalFollower,
  toggleLocalFollow,
  getLocalProfile,
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

    // 1. Remove follower action: removes target from the owner's followers list
    if (action === "remove_follower") {
      const ownerProfile = await getLocalProfile(username === "me" ? currentUsername : username);
      const targetProfile = await getLocalProfile(targetUsername);

      const ownerObj = {
        id: ownerProfile?.id || currentUserId,
        username: ownerProfile?.username || username,
      };
      const targetObj = {
        id: targetProfile?.id || `user-${targetUsername}`,
        username: targetProfile?.username || targetUsername,
      };

      // Best effort Supabase remove
      if (currentUser && ownerProfile?.id && targetProfile?.id) {
        try {
          await supabase
            .from("follows")
            .delete()
            .eq("follower_id", targetProfile.id)
            .eq("following_id", ownerProfile.id);
        } catch (err) {
          console.warn("Supabase remove follower warning:", err);
        }
      }

      const result = await removeLocalFollower(ownerObj, targetObj);
      return NextResponse.json({ success: true, followersCount: result.followersCount });
    }

    // 2. Unfollow action: current user unfollows target
    if (action === "unfollow") {
      const targetProfile = await getLocalProfile(targetUsername);

      const followerObj = {
        id: currentUserId,
        username: currentUsername,
      };
      const targetObj = {
        id: targetProfile?.id || `user-${targetUsername}`,
        username: targetProfile?.username || targetUsername,
      };

      // Best effort Supabase unfollow
      if (currentUser && targetProfile?.id) {
        try {
          await supabase
            .from("follows")
            .delete()
            .eq("follower_id", currentUser.id)
            .eq("following_id", targetProfile.id);
        } catch (err) {
          console.warn("Supabase unfollow warning:", err);
        }
      }

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
