import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Ensure user profile exists
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const emailPrefix = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "coder";
          const username = `${emailPrefix}_${user.id.substring(0, 5)}`;
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || emailPrefix;
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

          await supabase.from("profiles").insert({
            id: user.id,
            username,
            full_name: fullName,
            avatar_url: avatarUrl,
          });
        }
      }

      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${redirectBase}/login?error=auth_callback_failed`);
}
