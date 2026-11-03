import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  // Verify program ownership
  const { data: program } = await supabase
    .from("programs")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (!program || program.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden: You do not own this program" }, { status: 403 });
  }

  const { data: versions, error } = await supabase
    .from("program_versions")
    .select("*")
    .eq("program_id", id)
    .order("version_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions });
}
