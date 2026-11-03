import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SendMessageSchema = z.object({
  recipient_id: z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
  content: z.string().min(1, "Message cannot be empty").max(4000),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const convId = searchParams.get("conversationId");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If specific conversation messages are requested
  if (convId) {
    // Verify user is a participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", convId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "Forbidden: Not a participant" }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(username, full_name, avatar_url)")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages });
  }

  // Otherwise, list conversations for current user
  const { data: userConvs, error: convError } = await supabase
    .from("conversation_participants")
    .select(`
      conversation_id,
      conversation:conversations(
        id,
        updated_at,
        conversation_participants(
          user:profiles(id, username, full_name, avatar_url)
        )
      )
    `)
    .eq("user_id", user.id);

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  // Format conversations with the other participant info
  const formatted = (userConvs || []).map((c: any) => {
    const participants = c.conversation?.conversation_participants || [];
    const otherUser = participants.find((p: any) => p.user?.id !== user.id)?.user || null;
    return {
      id: c.conversation_id,
      updated_at: c.conversation?.updated_at,
      otherUser,
    };
  });

  return NextResponse.json({ conversations: formatted });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { recipient_id, conversation_id, content } = SendMessageSchema.parse(json);

    let targetConvId = conversation_id;

    // If starting a conversation with recipient_id
    if (!targetConvId && recipient_id) {
      if (recipient_id === user.id) {
        return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
      }

      // Check if existing conversation between these 2 users already exists
      const { data: existingParticipant } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const existingConvIds = (existingParticipant || []).map((p) => p.conversation_id);

      if (existingConvIds.length > 0) {
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .in("conversation_id", existingConvIds)
          .eq("user_id", recipient_id)
          .limit(1)
          .maybeSingle();

        if (shared) {
          targetConvId = shared.conversation_id;
        }
      }

      // If no conversation exists, create one
      if (!targetConvId) {
        const { data: newConv, error: cErr } = await supabase
          .from("conversations")
          .insert({})
          .select()
          .single();

        if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

        targetConvId = newConv.id;

        await supabase.from("conversation_participants").insert([
          { conversation_id: targetConvId, user_id: user.id },
          { conversation_id: targetConvId, user_id: recipient_id },
        ]);
      }
    }

    if (!targetConvId) {
      return NextResponse.json({ error: "No target conversation determined" }, { status: 400 });
    }

    // Insert message
    const { data: message, error: mErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: targetConvId,
        sender_id: user.id,
        content,
      })
      .select("*, sender:profiles!messages_sender_id_fkey(username, full_name, avatar_url)")
      .single();

    if (mErr) {
      return NextResponse.json({ error: mErr.message }, { status: 500 });
    }

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", targetConvId);

    return NextResponse.json({ message, conversation_id: targetConvId }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send message" },
      { status: 400 }
    );
  }
}
