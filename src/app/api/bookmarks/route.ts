import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLocalBookmarks, toggleLocalBookmark } from "@/lib/storage/communityStore";

const BookmarkSchema = z.object({
  target_type: z.enum(["post", "program", "collection"]),
  target_id: z.string().min(1),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "default-user";

  try {
    if (user) {
      const { data: rawBookmarks, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && rawBookmarks) {
        if (rawBookmarks.length === 0) {
          return NextResponse.json({ bookmarks: [] });
        }

        // Fast parallel batch enrichment: 3 batch queries instead of N+1 individual roundtrips
        const postIds = rawBookmarks.filter((b) => b.target_type === "post").map((b) => b.target_id);
        const progIds = rawBookmarks.filter((b) => b.target_type === "program").map((b) => b.target_id);
        const colIds = rawBookmarks.filter((b) => b.target_type === "collection").map((b) => b.target_id);

        const [postsRes, progsRes, colsRes] = await Promise.all([
          postIds.length > 0
            ? supabase
                .from("posts")
                .select(
                  `*, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url), comments(id), post_likes(user_id)`
                )
                .in("id", postIds)
            : Promise.resolve({ data: [] }),
          progIds.length > 0
            ? supabase
                .from("programs")
                .select("id, title, description, source_code, category, updated_at")
                .in("id", progIds)
            : Promise.resolve({ data: [] }),
          colIds.length > 0
            ? supabase
                .from("collections")
                .select("id, title, description, created_at")
                .in("id", colIds)
            : Promise.resolve({ data: [] }),
        ]);

        const postsMap = new Map(
          (postsRes.data || []).map((p: any) => {
            const isLiked = user ? p.post_likes?.some((l: { user_id: string }) => l.user_id === user.id) : false;
            const likesCount = p.post_likes?.length || p.likes_count || 0;
            const commentsCount = typeof p.comments?.length === "number" ? p.comments.length : (p.comments_count || 0);
            return [
              p.id,
              {
                ...p,
                is_liked: isLiked,
                is_bookmarked: true,
                likes_count: likesCount,
                comments_count: commentsCount,
              },
            ];
          })
        );

        const progsMap = new Map((progsRes.data || []).map((pr: any) => [pr.id, pr]));
        const colsMap = new Map((colsRes.data || []).map((c: any) => [c.id, c]));

        const enriched = rawBookmarks.map((b) => ({
          ...b,
          post: b.target_type === "post" ? postsMap.get(b.target_id) || null : null,
          program: b.target_type === "program" ? progsMap.get(b.target_id) || null : null,
          collection: b.target_type === "collection" ? colsMap.get(b.target_id) || null : null,
        }));

        return NextResponse.json(
          { bookmarks: enriched },
          { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" } }
        );
      }
    }
  } catch (err) {
    console.warn("Supabase bookmarks fetch failed, using local store:", err);
  }

  const localBookmarks = await getLocalBookmarks(userId);
  return NextResponse.json(
    { bookmarks: localBookmarks },
    { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to bookmark items." },
      { status: 401 }
    );
  }

  const userId = user.id;

  try {
    const json = await request.json();
    const { target_type, target_id } = BookmarkSchema.parse(json);

    let bookmarked = false;

    // Try Supabase first if logged in
    if (user) {
      try {
        // Ensure user profile exists for foreign key constraint
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const emailPrefix = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "coder";
          const username = user.user_metadata?.username || `${emailPrefix}_${user.id.substring(0, 5)}`;
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || emailPrefix;
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

          await supabase.from("profiles").upsert({
            id: user.id,
            username,
            full_name: fullName,
            avatar_url: avatarUrl,
          });
        }

        const { data: existing } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("target_type", target_type)
          .eq("target_id", target_id)
          .maybeSingle();

        if (existing) {
          await supabase.from("bookmarks").delete().eq("id", existing.id);
          bookmarked = false;
        } else {
          await supabase.from("bookmarks").insert({
            user_id: user.id,
            target_type,
            target_id,
          });
          bookmarked = true;
        }

        return NextResponse.json({ bookmarked });
      } catch (err) {
        console.warn("Supabase bookmark toggle error, falling back to local:", err);
      }
    }

    // Fallback to local store
    const localResult = await toggleLocalBookmark(userId, target_type, target_id);
    return NextResponse.json({ bookmarked: localResult.bookmarked });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid bookmark request" },
      { status: 400 }
    );
  }
}
