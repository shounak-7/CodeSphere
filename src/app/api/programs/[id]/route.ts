import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { saveLocalProgram, deleteLocalProgram, getLocalPrograms } from "@/lib/storage/workspaceStore";

const UpdateProgramSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  source_code: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folder_id: z.string().nullable().optional(),
  is_favorite: z.boolean().optional(),
  visibility: z.enum(["private", "public"]).optional(),
  create_version: z.boolean().optional(),
  change_description: z.string().max(200).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: program } = await supabase
      .from("programs")
      .select("*, profiles:owner_id(username, full_name, avatar_url)")
      .eq("id", id)
      .single();

    if (program) {
      return NextResponse.json({ program });
    }
  } catch {
    // Fallback to local store
  }

  const all = await getLocalPrograms();
  const found = all.find((p) => p.id === id);
  if (found) {
    return NextResponse.json({ program: found });
  }

  return NextResponse.json({ error: "Program not found" }, { status: 404 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  try {
    const json = await request.json();
    const parsed = UpdateProgramSchema.parse(json);
    const { create_version, change_description, ...updateFields } = parsed;

    // Try Supabase update if authenticated
    if (currentUser) {
      try {
        const { data: updated, error } = await supabase
          .from("programs")
          .update({
            ...updateFields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("owner_id", currentUser.id)
          .select()
          .single();

        if (error) {
          console.error("Supabase update program error:", error);
        } else if (updated) {
          if (create_version) {
            try {
              const { count } = await supabase
                .from("program_versions")
                .select("*", { count: "exact", head: true })
                .eq("program_id", id);

              await supabase.from("program_versions").insert({
                program_id: id,
                owner_id: currentUser.id,
                version_number: (count || 0) + 1,
                source_code: updated.source_code,
                change_description: change_description || "Checkpoint version",
              });
            } catch (vErr) {
              console.error("Version creation warning:", vErr);
            }
          }
          return NextResponse.json({ program: updated });
        }
      } catch (dbErr) {
        console.error("Supabase program update exception:", dbErr);
      }
    }

    // Local store update fallback
    const updatedLocal = await saveLocalProgram({
      id,
      ...(currentUser?.id ? { owner_id: currentUser.id } : {}),
      ...(parsed.title !== undefined && { title: parsed.title }),
      ...(parsed.source_code !== undefined && { source_code: parsed.source_code }),
      ...(parsed.description !== undefined && { description: parsed.description }),
      ...(parsed.category !== undefined && { category: parsed.category }),
      ...(parsed.tags !== undefined && { tags: parsed.tags }),
      ...(parsed.folder_id !== undefined && { folder_id: parsed.folder_id }),
      ...(parsed.is_favorite !== undefined && { is_favorite: parsed.is_favorite }),
      ...(parsed.visibility !== undefined && { visibility: parsed.visibility }),
    });

    return NextResponse.json({ program: updatedLocal });
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

  try {
    await supabase.from("programs").delete().eq("id", id);
  } catch {
    // Ignore
  }

  await deleteLocalProgram(id);
  return NextResponse.json({ success: true, deletedId: id });
}
