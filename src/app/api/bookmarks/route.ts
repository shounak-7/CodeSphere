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
      const { data: bookmarks, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && bookmarks && bookmarks.length > 0) {
        return NextResponse.json({ bookmarks });
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
      } catch (err) {
        console.warn("Supabase bookmark toggle error, falling back to local:", err);
      }
    }

    // Always update local store
    const localResult = await toggleLocalBookmark(userId, target_type, target_id);
    return NextResponse.json({ bookmarked: localResult.bookmarked });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid bookmark request" },
      { status: 400 }
    );
  }
}
