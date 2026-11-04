import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext !== "/workspace" ? rawNext : "/feed";

  // Properly determine target base URL across local dev & Vercel edge/proxies
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectBase = isLocalEnv
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // Ensure profile exists with an idempotent background upsert (zero redundant roundtrips)
      try {
        const admin = createAdminClient();
        const emailPrefix = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "coder";
        const username =
          (user.user_metadata?.user_name as string) ||
          (user.user_metadata?.username as string) ||
          `${emailPrefix}_${user.id.substring(0, 5)}`;
        const fullName =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          emailPrefix;
        const avatarUrl =
          (user.user_metadata?.avatar_url as string) ||
          (user.user_metadata?.picture as string) ||
          "";

        await admin.from("profiles").upsert(
          {
            id: user.id,
            username,
            full_name: fullName,
            avatar_url: avatarUrl,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      } catch (profileErr) {
        console.warn("Profile upsert during auth callback warning:", profileErr);
      }

      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${redirectBase}/login?error=auth_callback_failed`);
}
