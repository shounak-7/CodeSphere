import { subscribeToSession, TerminalEvent } from "@/lib/compiler/sessionManager";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return new Response("Session ID required", { status: 400 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("x-session-token");
  const compilerServiceUrl = process.env.COMPILER_SERVICE_URL || "http://localhost:4000";
  const compilerSecret =
    process.env.COMPILER_API_SECRET || "codesphere-sandbox-compiler-secret-key-2026";

  // Try proxying to dedicated compiler engine
  try {
    const remoteUrl = new URL(`/session/${sessionId}/stream`, compilerServiceUrl);
    if (token) remoteUrl.searchParams.set("token", token);

    const remoteRes = await fetch(remoteUrl.toString(), {
      headers: {
        "x-compiler-secret": compilerSecret,
        ...(token ? { "x-session-token": token } : {}),
      },
      signal: request.signal,
    });

    if (remoteRes.ok && remoteRes.body) {
      return new Response(remoteRes.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }
  } catch {
    // Fallback to local sessionManager in development
  }

  // Local fallback
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: TerminalEvent) => {
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
          if (event.type === "exit") {
            setTimeout(() => {
              try {
                controller.close();
              } catch {}
            }, 100);
          }
        } catch {
          // Client disconnected
        }
      };

      const unsubscribe = subscribeToSession(sessionId, sendEvent);
      request.signal.addEventListener("abort", () => {
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
