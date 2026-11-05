import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLocalPrograms, saveLocalProgram } from "@/lib/storage/workspaceStore";

const CreateProgramSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional().default(""),
  source_code: z.string().optional(),
  content: z.string().optional(),
  category: z.string().default("DSA"),
  tags: z.array(z.string()).default([]),
  folder_id: z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try fetching from Supabase first
  if (user) {
    try {
      const { data: programs, error } = await supabase
        .from("programs")
        .select("*")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error && programs && programs.length > 0) {
        return NextResponse.json(
          { programs },
          { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" } }
        );
      }
    } catch {
      // Fall through to local store
    }
  }

  // Resilient local persistent fallback
  const localPrograms = await getLocalPrograms(user?.id);

  return NextResponse.json(
    { programs: localPrograms },
    { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" } }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {}

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to save programs to your workspace." },
      { status: 401 }
    );
  }

  try {
    const json = await request.json();
    const parsed = CreateProgramSchema.parse(json);
    const finalSourceCode =
      parsed.source_code ||
      parsed.content ||
      `#include <stdio.h>\n\nint main() {\n    printf("Hello from CodeSphere!\\n");\n    return 0;\n}`;

    // Try Supabase first if authenticated
    if (user) {
      try {
        // Ensure user profile exists to satisfy foreign key constraint
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const emailPrefix = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "coder";
          const username = user.user_metadata?.username || `${emailPrefix}_${user.id.substring(0, 5)}`;
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || emailPrefix;
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

          await supabase.from("profiles").upsert({
            id: user.id,
            username,
            full_name: fullName,
            avatar_url: avatarUrl,
          });
        }

        const { data: program, error } = await supabase
          .from("programs")
          .insert({
            owner_id: user.id,
            title: parsed.title,
            description: parsed.description,
            source_code: finalSourceCode,
            language: "c",
            category: parsed.category,
            tags: parsed.tags,
            folder_id: parsed.folder_id || null,
            is_favorite: false,
            visibility: "private",
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase insert program error:", error);
        } else if (program) {
          // Checkpoint
          try {
            await supabase.from("program_versions").insert({
              program_id: program.id,
              owner_id: user.id,
              version_number: 1,
              source_code: program.source_code,
              change_description: "Initial program creation",
            });
          } catch {}

          return NextResponse.json({ program }, { status: 201 });
        }
      } catch (dbErr) {
        console.error("Supabase create program exception:", dbErr);
      }
    }

    // Fallback save to local persistent store
    const localProg = await saveLocalProgram({
      owner_id: user?.id || "default-user",
      title: parsed.title,
      description: parsed.description,
      source_code: finalSourceCode,
      language: "c",
      category: parsed.category,
      tags: parsed.tags,
      folder_id: parsed.folder_id || null,
      is_favorite: false,
      visibility: "private",
    });

    return NextResponse.json({ program: localProg }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid program creation payload" },
      { status: 400 }
    );
  }
}
