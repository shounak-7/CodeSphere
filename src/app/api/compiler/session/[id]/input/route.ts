import { NextResponse } from "next/server";
import { writeSessionInput } from "@/lib/compiler/sessionManager";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const { input, isEof } = await request.json();
    const token = request.headers.get("x-session-token");
    const compilerServiceUrl = process.env.COMPILER_SERVICE_URL || "http://localhost:4000";
    const compilerSecret =
      process.env.COMPILER_API_SECRET || "cs_sec_26a3c606d98b18517f988f5f5d3e0161e77e4e556109d369d393e7d3173c3e8d";

    // 1. Try forwarding to remote compiler engine
    try {
      const remoteRes = await fetch(`${compilerServiceUrl}/session/${sessionId}/input`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compiler-secret": compilerSecret,
          ...(token ? { "x-session-token": token } : {}),
        },
        body: JSON.stringify({ input, isEof }),
      });

      if (remoteRes.ok) {
        const data = await remoteRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to local sessionManager
    }

    // 2. Local fallback
    const ok = writeSessionInput(sessionId, input ?? "", Boolean(isEof));
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "Session not active or stdin closed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to deliver input",
      },
      { status: 500 }
    );
  }
}
