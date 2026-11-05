import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLocalPosts } from "@/lib/storage/communityStore";
import { getVerifiedEntities, checkIsVerified } from "@/lib/server/verification";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({
      profiles: [],
      programs: [],
      posts: [],
      collections: [],
    });
  }

  const supabase = await createClient();
  let profiles: any[] = [];
  let programs: any[] = [];
  let posts: any[] = [];
  let collections: any[] = [];

  try {
    // Search public profiles (matching username or full_name)
    const { data: p } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, college")
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10);
    if (p) profiles = p;

    // Search ONLY PUBLIC programs
    const { data: pr } = await supabase
      .from("programs")
      .select("id, title, description, category, tags, created_at, owner:profiles!programs_owner_id_fkey(username, full_name)")
      .eq("visibility", "public")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(15);
    if (pr) programs = pr;

    // Search public posts
    const { data: po } = await supabase
      .from("posts")
      .select("id, title, content, post_type, created_at, author:profiles!posts_author_id_fkey(username, full_name, avatar_url)")
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .limit(15);
    if (po) posts = po;

    // Search public collections
    const { data: c } = await supabase
      .from("collections")
      .select("id, title, description, tags, created_at, owner:profiles!collections_owner_id_fkey(username, full_name)")
      .eq("visibility", "public")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(10);
    if (c) collections = c;
  } catch {
    // Ignore Supabase errors and fall back to local store below
  }

  // Fallback to local store if profiles or posts are empty
  if (profiles.length === 0 || posts.length === 0) {
    try {
      const dataFile = join(process.cwd(), ".data", "community.json");
      const content = await readFile(dataFile, "utf8");
      const db = JSON.parse(content);
      const queryLower = q.toLowerCase();

      if (profiles.length === 0 && db.profiles) {
        profiles = db.profiles
          .filter(
            (p: any) =>
              p.username?.toLowerCase().includes(queryLower) ||
              p.full_name?.toLowerCase().includes(queryLower)
          )
          .slice(0, 10);
      }

      if (posts.length === 0 && db.posts) {
        posts = db.posts
          .filter(
            (p: any) =>
              p.title?.toLowerCase().includes(queryLower) ||
              p.content?.toLowerCase().includes(queryLower) ||
              p.tags?.some((t: string) => t.toLowerCase().includes(queryLower))
          )
          .slice(0, 15);
      }
    } catch {
      // Ignore
    }
  }

  const verifiedData = await getVerifiedEntities();

  const enrichedProfiles = profiles.map((p) => ({
    ...p,
    is_verified: checkIsVerified(p, verifiedData),
  }));

  const enrichedPosts = posts.map((post) => ({
    ...post,
    author: post.author
      ? {
          ...post.author,
          is_verified: checkIsVerified(post.author, verifiedData),
        }
      : undefined,
  }));

  return NextResponse.json({
    profiles: enrichedProfiles,
    programs,
    posts: enrichedPosts,
    collections,
  });
}
