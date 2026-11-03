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

    // Refresh auth session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protected paths that require authentication
    const protectedPaths = ["/workspace", "/messages", "/settings", "/bookmarks"];
    const isMyProfile =
      request.nextUrl.pathname === "/profile/me" ||
      request.nextUrl.pathname.startsWith("/profile/me/");
    const isProtectedPath =
      protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path)) ||
      isMyProfile;

    if (isProtectedPath && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Redirect logged in user from /login to /workspace
    if (request.nextUrl.pathname === "/login" && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/workspace";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("Middleware session update caught error:", err);
  }

  return supabaseResponse;
}
