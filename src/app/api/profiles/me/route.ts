import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

  // 1. Fetch from Supabase profiles table first (single source of truth in cloud)
  try {
    const { data: supaProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (supaProfile) {
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact" }).eq("following_id", userId),
        supabase.from("follows").select("following_id", { count: "exact" }).eq("follower_id", userId),
      ]);

      const [{ count: programsCount }, { count: postsCount }] = await Promise.all([
        supabase.from("programs").select("id", { count: "exact" }).eq("owner_id", userId),
        supabase.from("posts").select("id", { count: "exact" }).eq("author_id", userId),
      ]);

      return NextResponse.json({
        profile: supaProfile,
        isOwner: true,
        isFollowing: false,
        stats: {
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          programsCount: programsCount || 0,
          postsCount: postsCount || 0,
        },
        programs: [],
        posts: [],
        collections: [],
      });
    }
  } catch {}

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
        if (parsed.username) {
          const { data: existing } = await supabase
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

        await supabase
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
