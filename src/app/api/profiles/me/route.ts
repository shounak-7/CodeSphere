import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalProfileData, saveLocalProfile } from "@/lib/storage/communityStore";

const UpdateProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  college: z.string().max(120).optional(),
  skills: z.array(z.string()).optional(),
  avatar_url: z.string().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and dots").optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const admin = createAdminClient();

  // 1. Fetch profile, counts, programs, posts, and collections in a single parallel roundtrip
  try {
    const [
      profileRes,
      followersCountRes,
      followingCountRes,
      userProgramsRes,
      userPostsRes,
      userCollectionsRes,
    ] = await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      admin.from("follows").select("follower_id", { count: "exact" }).eq("following_id", userId),
      admin.from("follows").select("following_id", { count: "exact" }).eq("follower_id", userId),
      admin
        .from("programs")
        .select("id, title, description, category, language, visibility, created_at, updated_at")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false }),
      admin
        .from("posts")
        .select("*, author:profiles!posts_author_id_fkey(*), post_likes(user_id), comments(id)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false }),
      admin
        .from("collections")
        .select("*, collection_programs(count)")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false }),
    ]);

    const supaProfile = profileRes.data;

    if (supaProfile) {
      const followersCount = followersCountRes.count ?? (followersCountRes.data?.length || 0);
      const followingCount = followingCountRes.count ?? (followingCountRes.data?.length || 0);
      const programs = userProgramsRes.data || [];
      const posts = (userPostsRes.data || []).map((p) => ({
        ...p,
        is_liked: p.post_likes?.some((l: { user_id: string }) => l.user_id === userId) || false,
        likes_count: p.post_likes?.length || p.likes_count || 0,
        comments_count: p.comments?.length || p.comments_count || 0,
      }));
      const collections = (userCollectionsRes.data || []).map((c) => ({
        ...c,
        programs_count: c.collection_programs?.[0]?.count ?? 0,
      }));

      return NextResponse.json(
        {
          profile: supaProfile,
          isOwner: true,
          isFollowing: false,
          stats: {
            followersCount,
            followingCount,
            programsCount: programs.length,
            postsCount: posts.length,
          },
          programs,
          posts,
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
    console.warn("Supabase profile me query exception, using local store:", err);
  }

  const userMeta = {
    username: (user.user_metadata?.user_name as string) || (user.user_metadata?.username as string) || user.email?.split("@")[0] || "developer",
    full_name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "CodeSphere Developer",
    avatar_url: (user.user_metadata?.avatar_url as string) || (user.user_metadata?.picture as string) || "",
  };

  const profileData = await getLocalProfileData("me", userId, userMeta);

  return NextResponse.json({
    profile: profileData.profile,
    isOwner: true,
    isFollowing: false,
    stats: profileData.stats,
    programs: profileData.programs,
    posts: profileData.posts,
    collections: profileData.collections,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "default-user";

  try {
    const json = await request.json();
    const parsed = UpdateProfileSchema.parse(json);

    // Save locally and propagate changes to posts/comments
    const updatedProfile = await saveLocalProfile({
      id: userId,
      full_name: parsed.full_name,
      username: parsed.username,
      bio: parsed.bio !== undefined ? parsed.bio : "",
      college: parsed.college !== undefined ? parsed.college : "",
      skills: parsed.skills !== undefined ? parsed.skills : [],
      avatar_url: parsed.avatar_url !== undefined ? parsed.avatar_url : undefined,
    });

    // Best-effort sync to Supabase if logged in
    if (user) {
      try {
        const admin = createAdminClient();
        if (parsed.username) {
          const { data: existing } = await admin
            .from("profiles")
            .select("id")
            .eq("username", parsed.username)
            .neq("id", user.id)
            .maybeSingle();

          if (existing) {
            return NextResponse.json(
              { error: "Username is already taken by another user." },
              { status: 400 }
            );
          }
        }

        await admin
          .from("profiles")
          .update({
            ...parsed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (err) {
        console.warn("Supabase profile update warning:", err);
      }
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid profile update" },
      { status: 400 }
    );
  }
}
