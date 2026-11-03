import { NextResponse } from "next/server";
import { getRealTrendingTags } from "@/lib/storage/communityStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await getRealTrendingTags();
  return NextResponse.json({ tags });
}
