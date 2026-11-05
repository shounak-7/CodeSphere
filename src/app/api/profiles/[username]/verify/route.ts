import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleVerifiedStatus, isUserVerifiedAsync } from "@/lib/storage/communityStore";
import { isTeamAccount } from "@/lib/utils";
import { invalidateVerifiedCache } from "@/lib/server/verification";

// Known administrator IDs and usernames
const ADMIN_USER_IDS = new Set([
  "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1", // codesphere team
  "d8c1828a-8a3f-432a-bd06-477029bc21e2", // shounak (creator)
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Retrieve current user's profile to check authority
  const { data: callerProfile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", currentUser.id)
    .maybeSingle();

  const callerUsername =
    callerProfile?.username ||
    (currentUser?.user_metadata?.user_name as string) ||
    (currentUser?.user_metadata?.username as string) ||
    currentUser?.email?.split("@")[0] ||
    "";

  const isAuthorized =
    ADMIN_USER_IDS.has(currentUser.id) ||
    isTeamAccount(callerUsername) ||
    callerUsername.toLowerCase() === "shounak" ||
    currentUser.email?.toLowerCase() === "team@codesphere.io" ||
    currentUser.email?.toLowerCase() === "adhyashounak@gmail.com";

  if (!isAuthorized) {
    return NextResponse.json(
      {
        error:
          "Forbidden: Only official CodeSphere Administrators have the authority to grant or revoke verification badges.",
      },
      { status: 403 }
    );
  }

  try {
    const cleanTarget = username.toLowerCase().trim();

    // 1. Locate target profile in profiles table
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("*")
      .ilike("username", cleanTarget)
      .maybeSingle();

    let targetUserId = targetProfile?.id;
    let currentVerified = false;

    // 2. If target profile found in Supabase, check user_metadata in Supabase Auth
    if (targetUserId) {
      const { data: authUserData } = await admin.auth.admin.getUserById(targetUserId);
      if (authUserData?.user) {
        currentVerified = Boolean(
          authUserData.user.user_metadata?.is_verified ?? targetProfile?.is_verified
        );
      } else {
        currentVerified = Boolean(targetProfile?.is_verified);
      }
    } else {
      // Fallback to community store
      currentVerified = await isUserVerifiedAsync(cleanTarget);
    }

    const nextVerified = !currentVerified;

    // 3. Update Supabase Auth user_metadata (persistent in Supabase Auth)
    if (targetUserId) {
      const { data: authUserData } = await admin.auth.admin.getUserById(targetUserId);
      await admin.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...(authUserData?.user?.user_metadata || {}),
          is_verified: nextVerified,
        },
      });

      // 4. Try updating profiles table directly in Postgres (if is_verified column exists)
      try {
        await admin
          .from("profiles")
          .update({ is_verified: nextVerified, updated_at: new Date().toISOString() })
          .eq("id", targetUserId);
      } catch {
        // Ignored if column is not yet migrated
      }
    }

    // 5. Update local communityStore for full parity across JSON & memory
    let communityResult;
    try {
      communityResult = await toggleVerifiedStatus(cleanTarget, callerUsername || "codesphere");
    } catch {
      // Ignore if already toggled
    }

    invalidateVerifiedCache();

    return NextResponse.json({
      is_verified: nextVerified,
      profile: {
        ...(targetProfile || communityResult?.profile || {}),
        username: cleanTarget,
        is_verified: nextVerified,
      },
    });
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
  const clean = username.toLowerCase().trim();

  if (isTeamAccount(clean)) {
    return NextResponse.json({ is_verified: true });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, username")
    .ilike("username", clean)
    .maybeSingle();

  if (profile?.id) {
    const { data: authUserData } = await admin.auth.admin.getUserById(profile.id);
    if (authUserData?.user?.user_metadata?.is_verified === true) {
      return NextResponse.json({ is_verified: true });
    }
  }

  const verified = await isUserVerifiedAsync(clean);
  return NextResponse.json({ is_verified: verified });
}
