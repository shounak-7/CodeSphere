import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRealTrendingTags } from "@/lib/storage/communityStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: posts, error } = await supabase
      .from("posts")
      .select("tags");

    if (!error && posts) {
      const counts = new Map<string, number>();
      for (const p of posts) {
        if (Array.isArray(p.tags)) {
          for (const t of p.tags) {
            const clean = typeof t === "string" ? t.trim().toLowerCase().replace(/^#/, "") : "";
            if (clean) {
              counts.set(clean, (counts.get(clean) || 0) + 1);
            }
          }
        }
      }

      if (counts.size > 0) {
        const sorted = Array.from(counts.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
          .slice(0, 10);
        return NextResponse.json({ tags: sorted });
      } else if (posts.length > 0) {
        return NextResponse.json({ tags: [] });
      }
    }
  } catch (err) {
    console.warn("Error fetching trending tags from Supabase:", err);
  }

  const tags = await getRealTrendingTags();
  return NextResponse.json({ tags });
}
