import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const RestoreSchema = z.object({
  version_number: z.number().int().positive(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { version_number } = RestoreSchema.parse(json);

    // Verify program ownership
    const { data: program } = await supabase
      .from("programs")
      .select("*")
      .eq("id", id)
      .single();

    if (!program || program.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this program" }, { status: 403 });
    }

    // Fetch historical version
    const { data: targetVersion, error: vError } = await supabase
      .from("program_versions")
      .select("*")
      .eq("program_id", id)
      .eq("version_number", version_number)
      .single();

    if (vError || !targetVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Determine highest current version number
    const { data: latest } = await supabase
      .from("program_versions")
      .select("version_number")
      .eq("program_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const newVersionNumber = (latest?.version_number || 1) + 1;

    // Update program code
    await supabase
      .from("programs")
      .update({
        source_code: targetVersion.source_code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Create a new version checkpoint for the restore
    const { data: newVersion } = await supabase
      .from("program_versions")
      .insert({
        program_id: id,
        owner_id: user.id,
        version_number: newVersionNumber,
        source_code: targetVersion.source_code,
        change_description: `Restored from version ${version_number}`,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      restored_code: targetVersion.source_code,
      new_version: newVersion,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Restore failed" },
      { status: 400 }
    );
  }
}
