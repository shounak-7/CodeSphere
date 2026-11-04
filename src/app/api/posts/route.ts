import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLocalPosts, saveLocalPost, getLocalBookmarks, getLocalProfile } from "@/lib/storage/communityStore";

const CreatePostSchema = z.object({
  title: z.string().max(150).optional(),
  content: z.string().min(1, "Post content is required").max(5000),
  post_type: z.enum(["text", "code", "achievement", "question", "update"]).default("text"),
  code_snippet: z.string().max(30000).optional().nullable(),
  language: z.string().default("c"),
  program_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "latest"; // 'latest' | 'following' | 'questions'
  const tag = searchParams.get("tag") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    let query = supabase
      .from("posts")
      .select(
        `
        *,
        author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (tab === "questions") {
      query = query.eq("post_type", "question");
    }

    const { data: posts, error } = await query;

    if (!error && posts && posts.length > 0) {
      let bookmarkedIds = new Set<string>();
      let likedIds = new Set<string>();

      if (user) {
        const postIds = posts.map((p) => p.id);
        try {
          const [likesRes, bookmarksRes] = await Promise.all([
            supabase
              .from("post_likes")
              .select("post_id")
              .eq("user_id", user.id)
              .in("post_id", postIds),
            supabase
              .from("bookmarks")
              .select("target_id")
              .eq("user_id", user.id)
              .eq("target_type", "post")
              .in("target_id", postIds),
          ]);

          if (likesRes.data) {
            likedIds = new Set(likesRes.data.map((l: { post_id: string }) => l.post_id));
          }
          if (bookmarksRes.data && bookmarksRes.data.length > 0) {
            bookmarkedIds = new Set(bookmarksRes.data.map((b: { target_id: string }) => b.target_id));
          } else {
            const localBookmarks = await getLocalBookmarks(user.id);
            bookmarkedIds = new Set(localBookmarks.map((b) => b.target_id));
          }
        } catch {
          const localBookmarks = await getLocalBookmarks(user.id);
          bookmarkedIds = new Set(localBookmarks.map((b) => b.target_id));
        }
      }

      const formattedPosts = posts.map((post) => ({
        ...post,
        is_liked: likedIds.has(post.id),
        is_bookmarked: bookmarkedIds.has(post.id),
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
      }));

      return NextResponse.json(
        { posts: formattedPosts },
        {
          headers: {
            "Cache-Control": "private, max-age=3, stale-while-revalidate=15",
          },
        }
      );
    }
  } catch {
    // Fall back to local store
  }

  // Reliable persistent local store fallback
  const effectiveUserId = user?.id || "default-user";
  const userProfile = await getLocalProfile(effectiveUserId);
  const currentUsername =
    userProfile?.username ||
    (user?.user_metadata?.user_name as string) ||
    (user?.user_metadata?.username as string) ||
    user?.email?.split("@")[0] ||
    "developer";
  const localPosts = await getLocalPosts(tab, tag, effectiveUserId, currentUsername);
  return NextResponse.json({ posts: localPosts });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to create posts." },
      { status: 401 }
    );
  }

  try {
    const json = await request.json();
    const parsed = CreatePostSchema.parse(json);

    const authorId = user.id;
    const authorMeta = {
      id: authorId,
      username: user?.user_metadata?.username || user?.email?.split("@")[0] || "user",
      full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || "CodeSphere Member",
      avatar_url: user?.user_metadata?.avatar_url || "",
    };

    // Try Supabase insert
    if (user) {
      try {
        // Ensure user profile exists to satisfy foreign key constraint
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

        const { data: post, error } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            title: parsed.title || null,
            content: parsed.content,
            post_type: parsed.post_type,
            code_snippet: parsed.code_snippet || null,
            language: parsed.language,
            program_id: parsed.program_id || null,
            tags: parsed.tags,
          })
          .select(`*, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url)`)
          .single();

        if (error) {
          console.error("Supabase post creation error:", error);
        } else if (post) {
          return NextResponse.json({ post }, { status: 201 });
        }
      } catch (dbErr) {
        console.error("Supabase post creation exception:", dbErr);
      }
    }

    // Local store persistence
    const localPost = await saveLocalPost({
      author_id: authorId,
      author: authorMeta,
      title: parsed.title,
      content: parsed.content,
      post_type: parsed.post_type,
      code_snippet: parsed.code_snippet,
      language: parsed.language,
      program_id: parsed.program_id,
      tags: parsed.tags,
    });

    return NextResponse.json({ post: localPost }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid post submission" },
      { status: 400 }
    );
  }
}
