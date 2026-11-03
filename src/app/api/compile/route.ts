import { NextResponse } from "next/server";
import { z } from "zod";
import { executeCProgram } from "@/../compiler-service/src/executor.js";

const CompileRequestSchema = z.object({
  code: z.string().min(1, "Source code cannot be empty").max(256 * 1024, "Code exceeds 256KB limit"),
  stdin: z.string().max(64 * 1024, "Standard input exceeds 64KB limit").optional().default(""),
  timeoutMs: z.number().min(1000).max(60000).optional().default(30000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = CompileRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation error",
          phase: "validation",
        },
        { status: 400 }
      );
    }

    const { code, stdin, timeoutMs } = parsed.data;

    const compilerServiceUrl = process.env.COMPILER_SERVICE_URL;
    const compilerSecret = process.env.COMPILER_API_SECRET;

    // If compiler service is configured, forward batch execution to it
    if (compilerServiceUrl) {
      try {
        const remoteResponse = await fetch(`${compilerServiceUrl}/compile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-compiler-secret": compilerSecret || "",
          },
          body: JSON.stringify({ code, stdin, timeoutMs }),
          signal: AbortSignal.timeout(timeoutMs + 10000),
        });

        if (remoteResponse.ok) {
          const result = await remoteResponse.json();
          return NextResponse.json(result);
        }
      } catch {
        // Fall back to isolated local executor if available
      }
    }

    // Direct isolated GCC executor
    const result = await executeCProgram({ code, stdin, timeoutMs });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        phase: "system",
        error: error instanceof Error ? error.message : "Internal compilation error",
      },
      { status: 500 }
    );
  }
}
