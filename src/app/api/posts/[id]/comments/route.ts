import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalComments, addLocalComment } from "@/lib/storage/communityStore";
import { getVerifiedEntities, checkIsVerified } from "@/lib/server/verification";

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
      const verifiedData = await getVerifiedEntities();
      const formattedComments = comments.map((c) => ({
        ...c,
        author: c.author
          ? {
              ...c.author,
              is_verified: checkIsVerified(c.author, verifiedData),
            }
          : undefined,
      }));
      return NextResponse.json(
        { comments: formattedComments },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3, stale-while-revalidate=20",
          },
        }
      );
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

        if (error) {
          console.error("Supabase comment error:", error);
        } else if (comment) {
          // Increment comments_count on post and notify author
          try {
            const admin = createAdminClient();
            const { data: currentPost } = await admin
              .from("posts")
              .select("comments_count, author_id, title")
              .eq("id", postId)
              .single();

            if (currentPost) {
              const { count: exactCommentCount } = await admin
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", postId);

              const newCount =
                typeof exactCommentCount === "number"
                  ? exactCommentCount
                  : (currentPost.comments_count || 0) + 1;

              await admin
                .from("posts")
                .update({ comments_count: newCount })
                .eq("id", postId);

              // Notify author if not commenting on own post
              if (currentPost.author_id !== user.id) {
                await admin.from("notifications").insert({
                  recipient_id: currentPost.author_id,
                  actor_id: user.id,
                  notification_type: "comment",
                  reference_id: postId,
                  is_read: false,
                });

                // Real-time broadcast dispatch
                try {
                  const channel = admin.channel(`user-notifications-${currentPost.author_id}`);
                  await channel.send({
                    type: "broadcast",
                    event: "new_notification",
                    payload: {
                      notification_type: "comment",
                      reference_id: postId,
                      actor: authorMeta,
                      comment_text: content.slice(0, 80),
                      post_title: currentPost.title || undefined,
                    },
                  });
                } catch {}
              }
            }
          } catch (notifErr) {
            console.warn("Notification trigger warning:", notifErr);
          }

          const verifiedData = await getVerifiedEntities();
          const enrichedComment = {
            ...comment,
            author: comment.author
              ? {
                  ...comment.author,
                  is_verified: checkIsVerified(comment.author, verifiedData),
                }
              : undefined,
          };
          return NextResponse.json({ comment: enrichedComment }, { status: 201 });
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
