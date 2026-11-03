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
        // Ensure user profile exists for foreign key constraint
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

        if (error) {
          console.error("Supabase comment error:", error);
        } else if (comment) {
          // Increment comments_count on post and notify author
          try {
            const { data: currentPost } = await supabase
              .from("posts")
              .select("comments_count, author_id")
              .eq("id", postId)
              .single();

            if (currentPost) {
              await supabase
                .from("posts")
                .update({ comments_count: (currentPost.comments_count || 0) + 1 })
                .eq("id", postId);

              // Notify author if not commenting on own post
              if (currentPost.author_id !== user.id) {
                await supabase.from("notifications").insert({
                  recipient_id: currentPost.author_id,
                  actor_id: user.id,
                  notification_type: "comment",
                  reference_id: postId,
                  content: content.slice(0, 100),
                  is_read: false,
                });
              }
            }
          } catch (notifErr) {
            console.warn("Notification trigger warning:", notifErr);
          }

          return NextResponse.json({ comment }, { status: 201 });
        }
      } catch (dbErr) {
        console.error("Supabase comment exception:", dbErr);
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
