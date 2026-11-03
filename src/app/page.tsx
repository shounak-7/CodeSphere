import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Terminal,
  Code2,
  Users,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  Share2,
  FolderArchive,
  BookOpen,
  Heart,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect directly to the home feed dashboard
  if (user) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-16 lg:pt-28 pb-12 sm:pb-24 lg:pb-32">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/25 to-violet-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-[11px] sm:text-xs font-semibold mb-4 sm:mb-8 animate-fade-in">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>The Next-Generation Social Coding Workspace for C Developers</span>
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Your Code. Your Community. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
              Your Space.
            </span>
          </h1>

          <p className="mt-3 sm:mt-6 text-sm sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Write, save, run and share your code. Connect with developers and grow together on one platform.
          </p>

          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Get Started with Google</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>

            <Link
              href="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm border border-border bg-card/60 hover:bg-secondary hover:text-foreground text-muted-foreground transition-all"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
              <span>Explore Community</span>
            </Link>
          </div>
        </div>

        {/* Hero Interactive Code & Compiler Preview Mockup */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-16">
          <div className="rounded-xl sm:rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-3 border-b border-border bg-secondary/50 gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-500/80 shrink-0" />
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-yellow-500/80 shrink-0" />
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-green-500/80 shrink-0" />
                <span className="ml-1 sm:ml-3 text-[11px] sm:text-xs font-mono text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                  workspace/factorial_recursion.c
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  GCC 11 C11
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Autosaved
                </span>
              </div>
            </div>

            {/* Split Code & Output Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Code Editor View: Factorial Recursion */}
              <div className="lg:col-span-7 p-3 sm:p-5 bg-[#090d16] font-mono text-[11px] sm:text-xs lg:text-sm text-slate-300 leading-relaxed overflow-x-auto">
                <p><span className="text-indigo-400">#include</span> <span className="text-emerald-400">&lt;stdio.h&gt;</span></p>
                <p className="mt-1 sm:mt-2 text-slate-500">// Recursive factorial computation</p>
                <p><span className="text-blue-400">long long</span> <span className="text-yellow-400">factorial</span>(<span className="text-blue-400">int</span> n) &#123;</p>
                <p className="pl-3 sm:pl-4">  <span className="text-violet-400">if</span> (n &lt;= <span className="text-orange-400">1</span>) <span className="text-violet-400">return</span> <span className="text-orange-400">1</span>;</p>
                <p className="pl-3 sm:pl-4">  <span className="text-violet-400">return</span> n * <span className="text-yellow-400">factorial</span>(n - <span className="text-orange-400">1</span>);</p>
                <p>&#125;</p>
                <p className="mt-1 sm:mt-2"><span className="text-blue-400">int</span> <span className="text-yellow-400">main</span>() &#123;</p>
                <p className="pl-3 sm:pl-4">  <span className="text-blue-400">int</span> num = <span className="text-orange-400">5</span>;</p>
                <p className="pl-3 sm:pl-4">  printf(<span className="text-emerald-300">&quot;Enter number: %d\\n&quot;</span>, num);</p>
                <p className="pl-3 sm:pl-4">  printf(<span className="text-emerald-300">&quot;Factorial of %d = %lld\\n&quot;</span>, num, <span className="text-yellow-400">factorial</span>(num));</p>
                <p className="pl-3 sm:pl-4">  <span className="text-violet-400">return</span> <span className="text-orange-400">0</span>;</p>
                <p>&#125;</p>
              </div>

              {/* Console & Execution Result View */}
              <div className="lg:col-span-5 p-3 sm:p-5 bg-[#0d1322] flex flex-col justify-between font-mono text-[11px] sm:text-xs">
                <div>
                  <div className="flex items-center justify-between pb-2 sm:pb-3 mb-2 sm:mb-3 border-b border-border/50">
                    <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Terminal className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" /> STDOUT Terminal
                    </span>
                    <span className="text-emerald-400 font-bold text-[10px] sm:text-[11px]">0.024s (Success)</span>
                  </div>
                  <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">
{`Enter number: 5
Factorial of 5 = 120

[Process exited 0]`}
                  </pre>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border/50 flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Code2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Recursion Call Tree
                  </span>
                  <span>O(N) Time | O(N) Call Stack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-10 sm:py-20 bg-secondary/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything a C Programmer Needs</h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
              Built specifically for DSA learners, college students, and software engineers who write serious C code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-8">
            {/* Feature 1 */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3 sm:mb-5">
                <Code2 className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Personal VS Code Workspace</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Monaco Editor with full C syntax highlighting, autosave, folders, categories, version history, and one-click .c downloads.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 sm:mb-5">
                <Terminal className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Real GCC Online Compiler</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Genuine C11 compilation and execution engine. Supports custom stdin, pointers, dynamic memory, recursion, trees, and graphs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-lg sm:rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-3 sm:mb-5">
                <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Gemini AI Code Tutor</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Line-by-line code breakdowns, Big-O time and space complexity derivation, bug hunting, and beginner-friendly logic explanations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 sm:mb-5">
                <Users className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Social Community Feed</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Share programs, ask DSA questions, post snippets, like, comment, bookmark, and follow fellow developers.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 sm:mb-5">
                <FolderArchive className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Curated Code Collections</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Organize DSA programs into shareable collections: Linked Lists, Trees, Sorting Algorithms, or college lab assignments.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="w-9 sm:w-12 h-9 sm:h-12 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3 sm:mb-5">
                <Shield className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">Ironclad Privacy & RLS</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Your programs are private by default. PostgreSQL Row-Level Security ensures no one can read or modify your private code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
              <Terminal className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
            </div>
            <span className="font-bold text-sm sm:text-base text-foreground">CodeSphere</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground">© 2026</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block animate-pulse" />
            <span>by</span>
            <span className="font-bold text-foreground">Shounak</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="/collections" className="hover:text-foreground transition-colors">
              Collections
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
