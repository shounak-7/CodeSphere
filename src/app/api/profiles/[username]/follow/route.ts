import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleLocalFollow, getLocalProfile } from "@/lib/storage/communityStore";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to follow developers." },
      { status: 401 }
    );
  }

  const currentUserId = currentUser.id;
  const currentUsername =
    (currentUser?.user_metadata?.user_name as string) ||
    (currentUser?.user_metadata?.username as string) ||
    currentUser?.email?.split("@")[0] ||
    "user";
  const currentFullName =
    (currentUser?.user_metadata?.full_name as string) ||
    (currentUser?.user_metadata?.name as string) ||
    "CodeSphere Member";
  const currentAvatar =
    (currentUser?.user_metadata?.avatar_url as string) ||
    (currentUser?.user_metadata?.picture as string) ||
    "";

  // STRICT SELF-FOLLOW BLOCK
  const normalizedTargetUsername = username.toLowerCase().trim();
  const normalizedCurrentUsername = currentUsername.toLowerCase().trim();

  if (
    normalizedTargetUsername === "me" ||
    normalizedTargetUsername === normalizedCurrentUsername ||
    (currentUser && normalizedTargetUsername === currentUser.email?.split("@")[0].toLowerCase())
  ) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  // Look up target profile from Supabase first, fallback to local store
  let targetProfileId: string | null = null;
  let targetProfile = await getLocalProfile(username);

  if (currentUser) {
    try {
      const { data: supaTarget } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("username", username)
        .maybeSingle();
      if (supaTarget) {
        targetProfileId = supaTarget.id;
        if (!targetProfile) {
          targetProfile = supaTarget;
        }
      }
    } catch {}
  }

  if (!targetProfileId && targetProfile?.id) {
    targetProfileId = targetProfile.id;
  }

  if (targetProfile) {
    if (
      targetProfile.id === currentUserId ||
      targetProfile.username.toLowerCase() === normalizedCurrentUsername
    ) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }
  }

  // Supabase sync if user is signed in
  let supabaseToggled = false;
  let supabaseFollowing = false;
  if (currentUser && targetProfileId) {
    try {
      const { data: existing } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", targetProfileId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", targetProfileId);
        supabaseToggled = true;
        supabaseFollowing = false;
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: targetProfileId,
        });
        supabaseToggled = true;
        supabaseFollowing = true;
      }
    } catch (err) {
      console.warn("Supabase follow sync warning:", err);
    }
  }

  // Always update persistent community store
  const followerObj = {
    id: currentUserId,
    username: currentUsername,
    full_name: currentFullName,
    avatar_url: currentAvatar,
  };

  const targetObj = {
    id: targetProfile?.id || `user-${username}`,
    username: targetProfile?.username || username,
    full_name: targetProfile?.full_name || username,
    avatar_url: targetProfile?.avatar_url || "",
  };

  const result = await toggleLocalFollow(followerObj, targetObj);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ following: result.following });
}
