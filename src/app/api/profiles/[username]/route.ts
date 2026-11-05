import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalProfileData, isUserVerifiedAsync } from "@/lib/storage/communityStore";
import { getLocalPrograms } from "@/lib/storage/workspaceStore";
import { isTeamAccount } from "@/lib/utils";
import { getVerifiedEntities, checkIsVerified } from "@/lib/server/verification";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  let currentUserId: string | undefined = undefined;
  let userMeta: any = undefined;

  try {
    // Parallelize user session resolution, profile lookup, and verified entities fetch
    const userPromise = supabase.auth.getUser();
    const verifiedPromise = getVerifiedEntities();
    const profilePromise =
      username === "me"
        ? null
        : admin.from("profiles").select("*").ilike("username", username).maybeSingle();

    const [userRes, initialProfileRes, verifiedData] = await Promise.all([
      userPromise,
      profilePromise || Promise.resolve({ data: null }),
      verifiedPromise,
    ]);

    const currentUser = userRes.data?.user;
    currentUserId = currentUser ? currentUser.id : undefined;
    userMeta = currentUser
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

    let targetProfileId: string | null = null;
    let profile = initialProfileRes.data;

    if (username === "me") {
      if (currentUser) {
        const { data } = await admin.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        profile = data;
        targetProfileId = currentUser.id;
      }
    } else {
      targetProfileId = profile?.id || null;
    }

    if (profile && targetProfileId) {
      const isOwner = currentUser?.id === targetProfileId;
      profile.is_verified = checkIsVerified(profile, verifiedData);

      // Build program and collection queries based on ownership
      let programsQuery = admin
        .from("programs")
        .select("id, title, description, category, language, visibility, created_at, updated_at")
        .eq("owner_id", targetProfileId)
        .order("updated_at", { ascending: false });

      if (!isOwner) {
        programsQuery = programsQuery.eq("visibility", "public");
      }

      let collectionsQuery = admin
        .from("collections")
        .select("*, collection_programs(count)")
        .eq("owner_id", targetProfileId)
        .order("updated_at", { ascending: false });

      if (!isOwner) {
        collectionsQuery = collectionsQuery.eq("visibility", "public");
      }

      const [
        followersCountRes,
        followingCountRes,
        followCheckRes,
        followedByCheckRes,
        programsRes,
        postsRes,
        collectionsRes,
      ] = await Promise.all([
        admin.from("follows").select("follower_id", { count: "exact" }).eq("following_id", targetProfileId),
        admin.from("follows").select("following_id", { count: "exact" }).eq("follower_id", targetProfileId),
        currentUser && currentUser.id !== targetProfileId
          ? admin.from("follows").select("follower_id").eq("follower_id", currentUser.id).eq("following_id", targetProfileId).maybeSingle()
          : Promise.resolve({ data: null }),
        currentUser && currentUser.id !== targetProfileId
          ? admin.from("follows").select("follower_id").eq("follower_id", targetProfileId).eq("following_id", currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
        programsQuery,
        admin
          .from("posts")
          .select("*, author:profiles!posts_author_id_fkey(*), post_likes(user_id), comments(id)")
          .eq("author_id", targetProfileId)
          .order("created_at", { ascending: false }),
        collectionsQuery,
      ]);

      const isFollowing = !!followCheckRes.data;
      const isFollowedBy = !!followedByCheckRes.data;
      const followersCount = followersCountRes.count ?? (followersCountRes.data?.length || 0);
      const followingCount = followingCountRes.count ?? (followingCountRes.data?.length || 0);

      // Resilient local store public programs merge only if Supabase returned 0 programs
      const supaPrograms = programsRes.data || [];
      let combinedPrograms: any[] = [...supaPrograms];
      if (combinedPrograms.length === 0) {
        const localPrograms = await getLocalPrograms();
        const matchedLocal = localPrograms.filter((p) => {
          const belongs = p.owner_id === targetProfileId || (isOwner && p.owner_id === "default-user");
          return isOwner ? belongs : belongs && p.visibility === "public";
        });
        for (const lp of matchedLocal) {
          if (!combinedPrograms.some((p) => p.id === lp.id)) {
            combinedPrograms.push(lp);
          }
        }
      }

      const userPosts = (postsRes.data || []).map((p) => ({
        ...p,
        is_liked: currentUser ? p.post_likes?.some((l: { user_id: string }) => l.user_id === currentUser.id) : false,
        likes_count: p.post_likes?.length || p.likes_count || 0,
        comments_count: p.comments?.length || p.comments_count || 0,
      }));

      const collections = (collectionsRes.data || []).map((c) => ({
        ...c,
        programs_count: c.collection_programs?.[0]?.count ?? 0,
      }));

      return NextResponse.json(
        {
          profile,
          isOwner,
          isFollowing,
          isFollowedBy,
          stats: {
            followersCount,
            followingCount,
            programsCount: combinedPrograms.length,
            postsCount: userPosts.length,
          },
          programs: combinedPrograms,
          posts: userPosts,
          collections,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=3, stale-while-revalidate=15",
          },
        }
      );
    }
  } catch (err) {
    console.warn("Supabase profile fetch fallback to local store:", err);
  }

  // Fallback to unified persistent local store
  const localData = await getLocalProfileData(username, currentUserId, userMeta);
  return NextResponse.json(localData);
}
