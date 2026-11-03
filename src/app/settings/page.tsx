"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useThemeStore, AppTheme, EditorTheme } from "@/lib/store/useThemeStore";
import {
  Settings,
  User,
  Laptop,
  Moon,
  Sun,
  Code2,
  Edit3,
  ExternalLink,
  LogOut,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, editorTheme, setEditorTheme } = useThemeStore();

  const [profile, setProfile] = useState<{
    full_name: string;
    username: string;
    avatar_url?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/profiles/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            full_name: data.profile.full_name || "",
            username: data.profile.username || "",
            avatar_url: data.profile.avatar_url || "",
          });
        }
      });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 lg:py-8 space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-2.5 pb-3 sm:pb-4 border-b border-border">
          <Settings className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Preferences & Settings</h1>
        </div>

        {/* Public Developer Profile banner card pointing to Profile editing */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <UserAvatar
                src={profile?.avatar_url}
                alt={profile?.full_name || profile?.username || "Developer"}
                size="md"
                className="sm:w-12 sm:h-12 ring-2 ring-primary/20 shadow-xs"
              />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-foreground">
                  {profile?.full_name || profile?.username || "Developer Profile"}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-mono">
                  @{profile?.username || "developer"}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 max-w-md">
                  Your bio, headline, college/organization, C skills, and avatar photo are managed directly on your Profile.
                </p>
              </div>
            </div>

            <Link
              href="/profile/me?edit=true"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/25 transition-all shrink-0 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile & Photo</span>
            </Link>
          </div>
        </div>

        {/* Appearance & Themes */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-border">
            <Laptop className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-bold text-foreground">Theme & Monaco Editor Appearance</h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Global Theme */}
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-foreground mb-1.5 sm:mb-2">Platform Theme</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md">
                {[
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Laptop },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id as AppTheme)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      theme === item.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Monaco Independent Editor Theme */}
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-foreground mb-0.5 sm:mb-1">
                Monaco Code Editor Theme (Independent)
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mb-1.5 sm:mb-2">
                As per specification, your code editor theme can be configured independently from the platform theme.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-lg">
                {[
                  { id: "system", label: "Auto (Match)" },
                  { id: "vs-dark", label: "Dark (VS Code)" },
                  { id: "light", label: "Light" },
                  { id: "hc-black", label: "High Contrast" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setEditorTheme(item.id as EditorTheme)}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      editorTheme === item.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Session / Account Actions */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground">Sign Out of CodeSphere</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Sign out of your current session on this device.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
