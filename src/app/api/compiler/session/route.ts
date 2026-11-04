import { NextResponse } from "next/server";
import { createInteractiveSession } from "@/lib/compiler/sessionManager";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { code, userId } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "C Source code is required." },
        { status: 400 }
      );
    }

    const compilerServiceUrl = process.env.COMPILER_SERVICE_URL || "http://localhost:4000";
    const compilerSecret =
      process.env.COMPILER_API_SECRET || "cs_sec_26a3c606d98b18517f988f5f5d3e0161e77e4e556109d369d393e7d3173c3e8d";
    const publicCompilerUrl =
      process.env.NEXT_PUBLIC_COMPILER_SERVICE_URL ||
      (compilerServiceUrl.startsWith("http://localhost") ? "" : compilerServiceUrl);

    // 1. Forward session initiation to the dedicated Compiler Engine (Render / Docker)
    try {
      const remoteRes = await fetch(`${compilerServiceUrl}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-compiler-secret": compilerSecret,
        },
        body: JSON.stringify({ code, userId: userId || "anonymous" }),
        signal: AbortSignal.timeout(45000), // Generous 45s timeout for Render cold-starts
      });

      const data = await remoteRes.json();

      if (!remoteRes.ok || !data.success) {
        return NextResponse.json(
          {
            success: false,
            phase: data.phase || "compilation",
            error: data.error || "Compilation failed on compiler engine",
          },
          { status: remoteRes.status >= 400 && remoteRes.status < 500 ? remoteRes.status : 400 }
        );
      }

      const { sessionId, token, expiresAt } = data;

      // If a public compiler URL is configured (e.g. Render), client connects directly to bypass Vercel serverless limits
      // Otherwise in local dev without public domain, client can route through local Next.js proxy
      const streamUrl = publicCompilerUrl
        ? `${publicCompilerUrl}/session/${sessionId}/stream?token=${encodeURIComponent(token)}`
        : `/api/compiler/session/${sessionId}/stream?token=${encodeURIComponent(token)}`;

      const wsUrl = publicCompilerUrl
        ? `${publicCompilerUrl.replace(/^http/, "ws")}/session/${sessionId}/ws?token=${encodeURIComponent(token)}`
        : null;

      const inputUrl = publicCompilerUrl
        ? `${publicCompilerUrl}/session/${sessionId}/input`
        : `/api/compiler/session/${sessionId}/input`;

      const killUrl = publicCompilerUrl
        ? `${publicCompilerUrl}/session/${sessionId}/kill`
        : `/api/compiler/session/${sessionId}/kill`;

      return NextResponse.json({
        success: true,
        sessionId,
        token,
        expiresAt,
        streamUrl,
        wsUrl,
        inputUrl,
        killUrl,
      });
    } catch (remoteErr) {
      // In local development, if external compiler service is not running, fallback to local sessionManager
      console.warn("[Next.js Proxy] Compiler service unreachable, using local fallback:", remoteErr);
      const localResult = await createInteractiveSession(code);
      if (!localResult.success) {
        return NextResponse.json(
          { success: false, phase: localResult.phase, error: localResult.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        sessionId: localResult.sessionId,
        streamUrl: `/api/compiler/session/${localResult.sessionId}/stream`,
        inputUrl: `/api/compiler/session/${localResult.sessionId}/input`,
        killUrl: `/api/compiler/session/${localResult.sessionId}/kill`,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start compiler session",
      },
      { status: 500 }
    );
  }
}
