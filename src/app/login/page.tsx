"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Terminal,
  AlertCircle,
  Mail,
  Key,
  UserCheck,
  ArrowRight,
  Sun,
  Moon,
  ArrowLeft,
  User,
} from "lucide-react";
import { useThemeStore } from "@/lib/store/useThemeStore";

function LoginContent() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/feed";
  const authError = searchParams.get("error");

  useEffect(() => {
    setMounted(true);
  }, []);

  // If already logged in and not forced, redirect straight to target
  useEffect(() => {
    const isForced = searchParams.get("force") === "true";
    if (isForced) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push(redirectTo);
      }
    });
  }, [redirectTo, router, searchParams]);

  const toggleTheme = () => {
    const current = resolvedTheme || theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const supabase = createClient();

      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectTo
      )}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("provider is not enabled") ||
          error.message.toLowerCase().includes("unsupported provider")
        ) {
          setErrorMsg(
            "Google Auth is not enabled in your Supabase project dashboard yet. Please enable it under Authentication > Providers > Google, or use the Email/Password or 1-Click Developer Access below!"
          );
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const supabase = createClient();

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push(redirectTo);
        } else {
          setSuccessMsg("Account registered! You can now sign in with your credentials.");
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.push(redirectTo);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isDarkMode = mounted ? (resolvedTheme || theme) === "dark" : true;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-border bg-card/80 hover:bg-secondary text-foreground shadow-xs transition-all cursor-pointer"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-700" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="relative z-10 w-full max-w-md mx-auto px-3 py-4 sm:px-6 sm:py-8">
        {/* Brand Header */}
        <div className="text-center mb-4 sm:mb-6">
          <Link href="/" className="inline-flex items-center gap-2 sm:gap-3 group">
            <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform duration-200 text-white">
              <Terminal className="w-4 sm:w-6 h-4 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              CodeSphere
            </span>
          </Link>
          <h2 className="mt-3 sm:mt-4 text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? "Create your CodeSphere Account" : "Sign in to CodeSphere"}
          </h2>
          <p className="mt-1 text-[11px] sm:text-sm text-muted-foreground">
            {isSignUp
              ? "Join the C developer community, compile code online, and build projects."
              : "Welcome back! Enter your details to continue to your coding workspace."}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border shadow-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-xl">
          {(errorMsg || authError) && (
            <div className="mb-4 sm:mb-5 p-2.5 sm:p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-[11px] sm:text-xs flex items-start gap-2 sm:gap-2.5">
              <AlertCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {errorMsg ||
                  "Authentication failed. Please verify your Google sign-in configuration or try email sign-in below."}
              </span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 sm:mb-5 p-2.5 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs flex items-center gap-2">
              <UserCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google & 1-Click Sandbox Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-lg sm:rounded-xl shadow-xs text-[11px] sm:text-xs font-semibold text-foreground bg-card hover:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-3.5 sm:my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
              <span className="bg-card px-2.5 sm:px-3 text-muted-foreground font-semibold">
                Or with Email
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-2.5 sm:space-y-3">
            {isSignUp && (
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-foreground mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Shounak Adhya"
                    className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-3 text-[11px] sm:text-xs rounded-lg sm:rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-foreground mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-3 text-[11px] sm:text-xs rounded-lg sm:rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-foreground mb-1">Password</label>
              <div className="relative">
                <Key className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-8 sm:h-10 pl-8 sm:pl-9 pr-3 text-[11px] sm:text-xs rounded-lg sm:rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 sm:mt-3 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-primary hover:bg-primary/90 text-white text-[11px] sm:text-xs font-bold shadow-md shadow-primary/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isSignUp ? "Create CodeSphere Account" : "Sign In with Email"}</span>
              <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </button>

            <div className="text-center pt-1.5 sm:pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                }}
                className="text-[11px] sm:text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Register free"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 sm:py-6 text-center text-[10px] sm:text-xs text-muted-foreground">
        <p>By signing in, you agree to CodeSphere&apos;s Community Guidelines and Terms of Service.</p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
