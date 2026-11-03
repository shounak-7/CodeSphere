import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateLocalFolder, deleteLocalFolder } from "@/lib/storage/workspaceStore";

export const dynamic = "force-dynamic";

const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  parent_id: z.string().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const json = await request.json();
    const parsed = UpdateFolderSchema.parse(json);

    if (user) {
      try {
        const { data: updated, error } = await supabase
          .from("folders")
          .update({
            ...(parsed.name !== undefined && { name: parsed.name }),
            ...(parsed.parent_id !== undefined && { parent_id: parsed.parent_id }),
          })
          .eq("id", id)
          .eq("owner_id", user.id)
          .select()
          .single();

        if (!error && updated) {
          return NextResponse.json({ folder: updated });
        }
      } catch {
        // Fallback
      }
    }

    const localUpdated = await updateLocalFolder(id, parsed);
    if (localUpdated) {
      return NextResponse.json({ folder: localUpdated });
    }

    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid update data" },
      { status: 400 }
    );
  }
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

  if (user) {
    try {
      // In Supabase, foreign keys on programs have ON DELETE SET NULL
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (!error) {
        return NextResponse.json({ success: true });
      }
    } catch {
      // Fallback
    }
  }

  const ok = await deleteLocalFolder(id);
  return NextResponse.json({ success: ok });
}
