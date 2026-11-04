import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Middleware: Missing Supabase environment variables in runtime environment");
    return supabaseResponse;
  }

  // If OAuth code arrives on root or any page other than /auth/callback, route to /auth/callback
  if (
    request.nextUrl.searchParams.has("code") &&
    request.nextUrl.pathname !== "/auth/callback"
  ) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  // Check if route actually needs an auth check
  const pathname = request.nextUrl.pathname;
  const protectedPaths = ["/workspace", "/messages", "/settings", "/bookmarks"];
  const isMyProfile = pathname === "/profile/me" || pathname.startsWith("/profile/me/");
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path)) || isMyProfile;
  const isLoginPath = pathname === "/login";

  // Fast path: for public paths and API routes, do not block middleware on remote Supabase auth calls
  if (!isProtectedPath && !isLoginPath) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh auth session only on protected paths and login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtectedPath && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Redirect logged in user from /login to target only if not explicitly forced
    const isForced = request.nextUrl.searchParams.get("force") === "true";
    if (isLoginPath && user && !isForced) {
      const redirectTo = request.nextUrl.searchParams.get("redirectTo");
      const target = redirectTo && redirectTo !== "/login" ? redirectTo : "/workspace";
      const url = request.nextUrl.clone();
      url.pathname = target.startsWith("/") ? target : "/workspace";
      url.search = "";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("Middleware session update caught error:", err);
  }

  return supabaseResponse;
}
