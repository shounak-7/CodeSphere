import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLocalCollectionById,
  deleteLocalCollection,
} from "@/lib/storage/communityStore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data: collection, error } = await supabase
      .from("collections")
      .select(`
        *,
        owner:profiles!collections_owner_id_fkey(username, full_name, avatar_url),
        collection_programs(
          position,
          program:programs(id, title, description, source_code, category, tags, visibility, created_at)
        )
      `)
      .eq("id", id)
      .single();

    if (!error && collection) {
      if (collection.visibility === "private" && (!user || user.id !== collection.owner_id)) {
        return NextResponse.json({ error: "Forbidden: This collection is private" }, { status: 403 });
      }

      const isOwner = user?.id === collection.owner_id;
      const sanitizedPrograms = (collection.collection_programs || [])
        .filter((cp: any) => cp.program && (isOwner || cp.program.visibility === "public"))
        .map((cp: any) => cp.program);

      return NextResponse.json({
        collection: {
          ...collection,
          programs: sanitizedPrograms,
        },
      });
    }
  } catch {
    // Fall through to local collection store
  }

  // Check local store
  const localCol = await getLocalCollectionById(id);
  if (localCol) {
    if (localCol.visibility === "private" && (!user || user.id !== localCol.owner_id)) {
      return NextResponse.json({ error: "Forbidden: This collection is private" }, { status: 403 });
    }
    return NextResponse.json({ collection: localCol });
  }

  return NextResponse.json({ error: "Collection not found" }, { status: 404 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try Supabase delete
  if (user) {
    try {
      await supabase
        .from("collections")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);
    } catch {
      // Ignore
    }
  }

  // Also delete from local store
  await deleteLocalCollection(id, user?.id);

  return NextResponse.json({ success: true, deletedId: id });
}
