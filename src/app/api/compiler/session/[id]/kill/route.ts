import { NextResponse } from "next/server";
import { terminateSession } from "@/lib/compiler/sessionManager";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const token = request.headers.get("x-session-token");
  const compilerServiceUrl = process.env.COMPILER_SERVICE_URL || "http://localhost:4000";
  const compilerSecret =
    process.env.COMPILER_API_SECRET || "codesphere-sandbox-compiler-secret-key-2026";

  // 1. Try forwarding to remote compiler engine
  try {
    const remoteRes = await fetch(`${compilerServiceUrl}/session/${sessionId}/kill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-compiler-secret": compilerSecret,
        ...(token ? { "x-session-token": token } : {}),
      },
    });

    if (remoteRes.ok) {
      const data = await remoteRes.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback to local
  }

  // 2. Local fallback
  const ok = terminateSession(sessionId, "Terminated by user");
  return NextResponse.json({ success: ok });
}
