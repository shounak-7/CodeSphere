import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalPosts, saveLocalPost, getLocalBookmarks, getLocalProfile, isUserVerified } from "@/lib/storage/communityStore";
import { isTeamAccount, extractPostMedia } from "@/lib/utils";
import { getVerifiedEntities, checkIsVerified } from "@/lib/server/verification";
import { invalidateStorageCache } from "@/lib/server/storageQuota";

const CreatePostSchema = z.object({
  title: z.string().max(150).optional(),
  content: z.string().min(1, "Post content is required").max(5000),
  post_type: z.enum(["text", "code", "achievement", "question", "update"]).default("text"),
  code_snippet: z.string().max(30000).optional().nullable(),
  media_url: z.string().max(1000).optional().nullable(),
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

    if (!error && posts) {
      if (posts.length === 0) {
        return NextResponse.json(
          { posts: [] },
          {
            headers: {
              "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
            },
          }
        );
      }

      let bookmarkedIds = new Set<string>();
      let likedIds = new Set<string>();
      const postLikesCountMap = new Map<string, number>();
      const postIds = posts.map((p) => p.id);

      const [verifiedData, likesRes, bookmarksRes] = await Promise.all([
        getVerifiedEntities(),
        supabase
          .from("post_likes")
          .select("post_id, user_id")
          .in("post_id", postIds),
        user
          ? supabase
              .from("bookmarks")
              .select("target_id")
              .eq("user_id", user.id)
              .eq("target_type", "post")
              .in("target_id", postIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (likesRes.data) {
        for (const l of likesRes.data as { post_id: string; user_id: string }[]) {
          postLikesCountMap.set(l.post_id, (postLikesCountMap.get(l.post_id) || 0) + 1);
          if (user && l.user_id === user.id) {
            likedIds.add(l.post_id);
          }
        }
      }

      if (bookmarksRes?.data && bookmarksRes.data.length > 0) {
        bookmarkedIds = new Set(bookmarksRes.data.map((b: { target_id: string }) => b.target_id));
      } else if (user) {
        const localBookmarks = await getLocalBookmarks(user.id);
        bookmarkedIds = new Set(localBookmarks.map((b) => b.target_id));
      }

      const formattedPosts = posts.map((post) => {
        const { content: cleanContent, mediaUrl } = extractPostMedia(
          post.content || "",
          (post as any).media_url
        );

        return {
          ...post,
          content: cleanContent,
          media_url: mediaUrl,
          author: post.author
            ? {
                ...post.author,
                is_verified: checkIsVerified(post.author, verifiedData),
              }
            : undefined,
          is_liked: likedIds.has(post.id),
          is_bookmarked: bookmarkedIds.has(post.id),
          is_author: user ? post.author_id === user.id : false,
          likes_count: postLikesCountMap.has(post.id) ? postLikesCountMap.get(post.id)! : (post.likes_count || 0),
          comments_count: post.comments_count || 0,
        };
      });

      return NextResponse.json(
        { posts: formattedPosts },
        {
          headers: {
            "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
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

    // Use admin client for verified and resilient database persistence
    const admin = createAdminClient();

    try {
      // 1. Ensure user profile exists to satisfy foreign key constraint
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const emailPrefix = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "coder";
        let baseUsername = (user.user_metadata?.username || user.user_metadata?.user_name || emailPrefix).toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!baseUsername || baseUsername.length < 3) baseUsername = `coder_${user.id.substring(0, 5)}`;

        // Guarantee unique username in profiles table
        const { data: conflict } = await admin
          .from("profiles")
          .select("id")
          .eq("username", baseUsername)
          .maybeSingle();

        const finalUsername = conflict && conflict.id !== user.id
          ? `${baseUsername.slice(0, 18)}_${user.id.replace(/-/g, "").substring(0, 4)}`
          : baseUsername;

        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || emailPrefix;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

        const { error: profileErr } = await admin.from("profiles").upsert({
          id: user.id,
          username: finalUsername,
          full_name: fullName,
          avatar_url: avatarUrl,
        });

        if (profileErr) {
          console.warn("Profile upsert retry with fallback username:", profileErr);
          await admin.from("profiles").upsert({
            id: user.id,
            username: `coder_${user.id.replace(/-/g, "").substring(0, 8)}`,
            full_name: fullName,
            avatar_url: avatarUrl,
          });
        }
      }

      // 2. Prepare post insertion payload
      // Embed media_url directly in content as marker <!--media:...--> to ensure 100% schema compatibility
      // without failing on PGRST204 column missing error in Supabase
      const rawContent = parsed.content.trim();
      const finalContent = parsed.media_url
        ? `${rawContent}\n<!--media:${parsed.media_url}-->`
        : rawContent;

      const insertPayload: any = {
        author_id: user.id,
        title: parsed.title || null,
        content: finalContent,
        post_type: parsed.post_type,
        code_snippet: parsed.code_snippet || null,
        language: parsed.language,
        program_id: parsed.program_id || null,
        tags: parsed.tags,
      };

      const { data: post, error } = await admin
        .from("posts")
        .insert(insertPayload)
        .select(`*, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url)`)
        .single();

      if (post) {
        invalidateStorageCache(user.id);
        const [verifiedData] = await Promise.all([getVerifiedEntities()]);
        const authorObj = post.author || existingProfile || authorMeta;
        const formattedPost = {
          ...post,
          content: rawContent,
          media_url: parsed.media_url || null,
          author: authorObj
            ? {
                ...authorObj,
                is_verified: checkIsVerified(authorObj, verifiedData),
              }
            : undefined,
          is_liked: false,
          is_bookmarked: false,
          is_author: true,
          likes_count: 0,
          comments_count: 0,
        };
        return NextResponse.json({ post: formattedPost }, { status: 201 });
      }

      if (error) {
        console.error("Supabase post creation error:", error);
      }
    } catch (dbErr) {
      console.error("Supabase post creation exception:", dbErr);
    }

    // Local store persistence fallback only if database insert completely failed
    const localPost = await saveLocalPost({
      author_id: authorId,
      author: authorMeta,
      title: parsed.title,
      content: parsed.content,
      post_type: parsed.post_type,
      code_snippet: parsed.code_snippet,
      media_url: parsed.media_url,
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
