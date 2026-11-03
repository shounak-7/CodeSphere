import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLocalComments, addLocalComment } from "@/lib/storage/communityStore";

const CreateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  parent_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();

  try {
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && comments) {
      return NextResponse.json({ comments });
    }
  } catch {
    // Fall back to local store
  }

  const localComments = await getLocalComments(postId);
  return NextResponse.json({ comments: localComments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to comment." },
      { status: 401 }
    );
  }

  try {
    const json = await request.json();
    const { content, parent_id } = CreateCommentSchema.parse(json);

    const authorId = user.id;
    const authorMeta = {
      username:
        (user?.user_metadata?.user_name as string) ||
        (user?.user_metadata?.username as string) ||
        user?.email?.split("@")[0] ||
        "user",
      full_name:
        (user?.user_metadata?.full_name as string) ||
        (user?.user_metadata?.name as string) ||
        "CodeSphere Member",
      avatar_url:
        (user?.user_metadata?.avatar_url as string) ||
        (user?.user_metadata?.picture as string) ||
        "",
    };

    if (user) {
      try {
        const { data: comment, error } = await supabase
          .from("comments")
          .insert({
            post_id: postId,
            author_id: user.id,
            content,
            parent_id: parent_id || null,
          })
          .select(`
            *,
            author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
          `)
          .single();

        if (!error && comment) {
          return NextResponse.json({ comment }, { status: 201 });
        }
      } catch {
        // Fall back to local store
      }
    }

    const localComment = await addLocalComment(postId, authorId, authorMeta, content);
    return NextResponse.json({ comment: localComment }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid comment submission" },
      { status: 400 }
    );
  }
}
