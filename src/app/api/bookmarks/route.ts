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
        // Enrich bookmarks with their target entity details
        const enriched = await Promise.all(
          rawBookmarks.map(async (b) => {
            let post = null;
            let program = null;
            let collection = null;

            if (b.target_type === "post") {
              const { data: p } = await supabase
                .from("posts")
                .select(
                  `*, author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url)`
                )
                .eq("id", b.target_id)
                .maybeSingle();
              post = p;
            } else if (b.target_type === "program") {
              const { data: prog } = await supabase
                .from("programs")
                .select("id, title, description, source_code, category, updated_at")
                .eq("id", b.target_id)
                .maybeSingle();
              program = prog;
            } else if (b.target_type === "collection") {
              const { data: col } = await supabase
                .from("collections")
                .select("id, title, description, created_at")
                .eq("id", b.target_id)
                .maybeSingle();
              collection = col;
            }

            return {
              ...b,
              post,
              program,
              collection,
            };
          })
        );

        return NextResponse.json({ bookmarks: enriched });
      }
    }
  } catch (err) {
    console.warn("Supabase bookmarks fetch failed, using local store:", err);
  }

  const localBookmarks = await getLocalBookmarks(userId);
  return NextResponse.json({ bookmarks: localBookmarks });
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
