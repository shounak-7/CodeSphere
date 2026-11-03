import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleVerifiedStatus, isUserVerifiedAsync } from "@/lib/storage/communityStore";
import { isTeamAccount } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const currentUsername =
    (currentUser?.user_metadata?.user_name as string) ||
    (currentUser?.user_metadata?.username as string) ||
    currentUser?.email?.split("@")[0] ||
    "";

  const isTeam =
    isTeamAccount(currentUsername) ||
    currentUser?.email?.toLowerCase() === "team@codesphere.io" ||
    currentUser?.id === "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1";

  if (!isTeam) {
    return NextResponse.json(
      {
        error:
          "Forbidden: Only the official CodeSphere Team account has the authority to grant or revoke verification badges.",
      },
      { status: 403 }
    );
  }

  try {
    const result = await toggleVerifiedStatus(username, currentUsername || "codesphere");
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update verification status" },
      { status: 400 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const verified = await isUserVerifiedAsync(username);
  return NextResponse.json({ is_verified: verified });
}
