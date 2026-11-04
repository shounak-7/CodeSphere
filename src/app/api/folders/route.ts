import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLocalFolders, saveLocalFolder } from "@/lib/storage/workspaceStore";

const CreateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(60),
  parent_id: z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const { data: folders, error } = await supabase
        .from("folders")
        .select("*")
        .eq("owner_id", user.id)
        .order("name", { ascending: true });

      if (!error && folders) {
        return NextResponse.json(
          { folders },
          { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" } }
        );
      }
    } catch {
      // Fallback
    }
  }

  const folders = await getLocalFolders(user?.id);
  return NextResponse.json(
    { folders },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const json = await request.json();
    const { name, parent_id } = CreateFolderSchema.parse(json);

    if (user) {
      try {
        const { data: folder, error } = await supabase
          .from("folders")
          .insert({
            owner_id: user.id,
            name,
            parent_id: parent_id || null,
          })
          .select()
          .single();

        if (!error && folder) {
          return NextResponse.json({ folder }, { status: 201 });
        }
      } catch {
        // Fallback
      }
    }

    const localFolder = await saveLocalFolder(name, user?.id || "default-user", parent_id || null);
    return NextResponse.json({ folder: localFolder }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid folder data" },
      { status: 400 }
    );
  }
}
