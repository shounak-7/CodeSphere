import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getLocalCollections,
  saveLocalCollection,
  isUserVerified,
} from "@/lib/storage/communityStore";
import { getLocalPrograms } from "@/lib/storage/workspaceStore";
import { isTeamAccount } from "@/lib/utils";

const CreateCollectionSchema = z.object({
  title: z.string().min(1, "Folder name is required").max(100),
  description: z.string().max(500).optional().default(""),
  visibility: z.enum(["private", "public"]).default("public"),
  tags: z.array(z.string()).default([]),
  program_ids: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const { data: collections, error } = await supabase
      .from("collections")
      .select(`
        *,
        owner:profiles!collections_owner_id_fkey(username, full_name, avatar_url),
        collection_programs(
          position,
          program:programs(id, title, description, visibility, category, tags, created_at)
        )
      `)
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    if (!error && collections && collections.length > 0) {
      const sanitized = collections.map((col) => ({
        ...col,
        owner: col.owner
          ? {
              ...col.owner,
              is_verified:
                Boolean(col.owner.is_verified) ||
                isTeamAccount(col.owner.username) ||
                isUserVerified(col.owner.username),
            }
          : undefined,
        collection_programs: (col.collection_programs || []).filter(
          (cp: any) => cp.program != null
        ),
      }));
      return NextResponse.json(
        { collections: sanitized },
        { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" } }
      );
    }
  } catch {
    // Fallback to local store
  }

  // Resilient fallback to local collections store
  const localCollections = await getLocalCollections();
  return NextResponse.json(
    { collections: localCollections },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60" } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to create collections." },
      { status: 401 }
    );
  }

  try {
    const json = await request.json();
    const parsed = CreateCollectionSchema.parse(json);

    // Dynamic profile identity matching the signed-in user
    const username =
      user?.user_metadata?.username ||
      user?.email?.split("@")[0] ||
      "developer";
    const fullName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      username;
    const avatarUrl = user?.user_metadata?.avatar_url || "";

    let authorProfile = {
      id: user?.id || "default-user",
      username,
      full_name: fullName,
      avatar_url: avatarUrl,
    };

    if (user) {
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (prof && prof.username) {
          authorProfile = {
            id: prof.id || user.id,
            username: prof.username,
            full_name: prof.full_name || prof.username,
            avatar_url: prof.avatar_url || avatarUrl,
          };
        }
      } catch {
        // Ignore
      }
    }

    // Resolve the selected programs from workspace
    let selectedPrograms: any[] = [];
    if (parsed.program_ids.length > 0) {
      // 1. Check local workspace programs first (guarantees local edits are captured)
      const localProgs = await getLocalPrograms(user?.id);
      const foundInLocal = localProgs.filter((p) => parsed.program_ids.includes(p.id));
      selectedPrograms = [...foundInLocal];

      // 2. Also check Supabase programs if any IDs missing
      if (selectedPrograms.length < parsed.program_ids.length && user) {
        try {
          const missingIds = parsed.program_ids.filter(
            (id) => !selectedPrograms.some((p) => p.id === id)
          );
          const { data: supaProgs } = await supabase
            .from("programs")
            .select("id, title, description, source_code, category, tags, visibility, created_at")
            .in("id", missingIds);

          if (supaProgs && supaProgs.length > 0) {
            selectedPrograms = [...selectedPrograms, ...supaProgs];
            // If publishing public collection, make sure selected programs are marked public
            if (parsed.visibility === "public") {
              await supabase
                .from("programs")
                .update({ visibility: "public" })
                .in("id", supaProgs.map((p) => p.id));
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    // Try creating in Supabase
    if (user) {
      try {
        const { data: collection, error } = await supabase
          .from("collections")
          .insert({
            owner_id: user.id,
            title: parsed.title,
            description: parsed.description,
            visibility: parsed.visibility,
            tags: [],
          })
          .select()
          .single();

        if (!error && collection) {
          if (selectedPrograms.length > 0) {
            const rows = selectedPrograms.map((p, idx) => ({
              collection_id: collection.id,
              program_id: p.id,
              position: idx,
            }));
            await supabase.from("collection_programs").insert(rows);
          }
          return NextResponse.json({ collection }, { status: 201 });
        }
      } catch {
        // Fallback to local store
      }
    }

    // Resilient fallback to local collections store
    const localCollection = await saveLocalCollection({
      owner_id: authorProfile.id,
      owner: authorProfile,
      title: parsed.title,
      description: parsed.description,
      tags: [],
      visibility: parsed.visibility,
      programs: selectedPrograms.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        source_code: p.source_code,
        category: p.category || "DSA",
        tags: [],
        created_at: p.created_at || new Date().toISOString(),
      })),
    });

    return NextResponse.json({ collection: localCollection }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create collection" },
      { status: 400 }
    );
  }
}
