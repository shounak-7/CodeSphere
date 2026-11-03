import { NextResponse } from "next/server";
import { z } from "zod";
import { explainCode, ExplanationMode } from "@/lib/ai/gemini";

const ExplainRequestSchema = z.object({
  code: z.string().min(1, "Source code cannot be empty").max(100 * 1024, "Code exceeds maximum size for AI explanation"),
  mode: z.enum([
    "complete",
    "line_by_line",
    "logic",
    "algorithm",
    "complexity",
    "bugs",
    "improvements",
    "beginner",
  ] as const).default("complete"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ExplainRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request payload" },
        { status: 400 }
      );
    }

    const { code, mode } = parsed.data;
    const explanation = await explainCode(code, mode as ExplanationMode);

    return NextResponse.json({ success: true, explanation, mode });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate AI code explanation",
      },
      { status: 500 }
    );
  }
}
