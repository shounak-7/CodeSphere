import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const compilerUrl = process.env.COMPILER_SERVICE_URL || "http://localhost:4000";

  try {
    const res = await fetch(`${compilerUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      status: res.ok ? "warm" : "waking",
      service: data.service || "compiler-engine",
    });
  } catch {
    // If Render container is sleeping, connecting immediately triggers Render's wake-up routine
    return NextResponse.json({
      status: "awakening",
      message: "Compiler warm-up signal dispatched",
    });
  }
}
