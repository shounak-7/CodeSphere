import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalProfileData } from "@/lib/storage/communityStore";
import { getLocalPrograms } from "@/lib/storage/workspaceStore";

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
  const userMeta = currentUser
    ? {
        username:
          (currentUser.user_metadata?.user_name as string) ||
          (currentUser.user_metadata?.username as string) ||
          currentUser.email?.split("@")[0] ||
          "",
        full_name:
          (currentUser.user_metadata?.full_name as string) ||
          (currentUser.user_metadata?.name as string) ||
          "",
        avatar_url:
          (currentUser.user_metadata?.avatar_url as string) ||
          (currentUser.user_metadata?.picture as string) ||
          "",
      }
    : undefined;

  try {
    // If Supabase has profiles table, attempt query
    let targetProfileId: string | null = null;
    let profile = null;

    if (username === "me") {
      if (currentUser) {
        const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        profile = data;
        targetProfileId = currentUser.id;
      }
    } else {
      const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      profile = data;
      targetProfileId = profile?.id || null;
    }

    if (profile && targetProfileId) {
      // Fetch follower & following counts
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact" }).eq("following_id", targetProfileId),
        supabase.from("follows").select("following_id", { count: "exact" }).eq("follower_id", targetProfileId),
      ]);

      let isFollowing = false;
      let isFollowedBy = false;

      if (currentUser && currentUser.id !== targetProfileId) {
        const [{ data: followRecord }, { data: followedByRecord }] = await Promise.all([
          supabase.from("follows").select("follower_id").eq("follower_id", currentUser.id).eq("following_id", targetProfileId).maybeSingle(),
          supabase.from("follows").select("follower_id").eq("follower_id", targetProfileId).eq("following_id", currentUser.id).maybeSingle(),
        ]);
        isFollowing = !!followRecord;
        isFollowedBy = !!followedByRecord;
      }

      const isOwner = currentUser?.id === targetProfileId;

      // Fetch public programs from Supabase
      let supaPrograms: any[] = [];
      try {
        const { data: progs } = await supabase
          .from("programs")
          .select("*")
          .eq("owner_id", targetProfileId)
          .eq("visibility", "public")
          .order("created_at", { ascending: false });
        if (progs) supaPrograms = progs;
      } catch {}

      // Resilient local store public programs
      const localPrograms = await getLocalPrograms();
      const matchedLocal = localPrograms.filter((p) => {
        const belongs = p.owner_id === targetProfileId || (isOwner && p.owner_id === "default-user");
        return belongs && p.visibility === "public";
      });

      const combinedPrograms = [...supaPrograms];
      for (const lp of matchedLocal) {
        if (!combinedPrograms.some((p) => p.id === lp.id)) {
          combinedPrograms.push(lp);
        }
      }

      // Fetch posts for this user
      let userPosts: any[] = [];
      try {
        const { data: posts } = await supabase
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(*)")
          .eq("author_id", targetProfileId)
          .order("created_at", { ascending: false });
        if (posts) userPosts = posts;
      } catch {}

      return NextResponse.json({
        profile,
        isOwner,
        isFollowing,
        isFollowedBy,
        stats: {
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          programsCount: combinedPrograms.length,
          postsCount: userPosts.length,
        },
        programs: combinedPrograms,
        posts: userPosts,
        collections: [],
      });
    }
  } catch (err) {
    console.warn("Supabase profile fetch fallback to local store:", err);
  }

  // Fallback to unified persistent local store
  const localData = await getLocalProfileData(username, currentUserId, userMeta);
  return NextResponse.json(localData);
}
