"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useThemeStore, AppTheme, EditorTheme } from "@/lib/store/useThemeStore";
import { useToastStore } from "@/lib/store/useToastStore";
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
  HardDrive,
  FileCode,
  Image as ImageIcon,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUserStore } from "@/lib/store/useUserStore";
import { formatBytes } from "@/lib/utils/imageOptimizer";

interface StorageQuotaData {
  userId: string;
  codeBytes: number;
  programsBytes: number;
  versionsBytes: number;
  programsCount: number;
  versionsCount: number;

  mediaBytes: number;
  avatarBytes: number;
  postMediaBytes: number;
  mediaFilesCount: number;

  totalBytes: number;
  totalLimitBytes: number;
  codeLimitBytes: number;
  avatarLimitBytes: number;
  mediaLimitBytes: number;

  remainingTotalBytes: number;
  remainingCodeBytes: number;
  remainingAvatarBytes: number;
  remainingMediaBytes: number;

  totalPercent: number;
  codePercent: number;
  mediaPercent: number;

  isWarning: boolean;
  isExhausted: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, editorTheme, setEditorTheme } = useThemeStore();
  const storeProfile = useUserStore((s) => s.profile);

  const [profile, setProfile] = useState<{
    full_name: string;
    username: string;
    avatar_url?: string;
  } | null>(() => {
    if (storeProfile) {
      return {
        full_name: storeProfile.full_name || "",
        username: storeProfile.username || "",
        avatar_url: storeProfile.avatar_url || "",
      };
    }
    return null;
  });

  useEffect(() => {
    if (storeProfile) {
      setProfile({
        full_name: storeProfile.full_name || "",
        username: storeProfile.username || "",
        avatar_url: storeProfile.avatar_url || "",
      });
    } else {
      useUserStore.getState().refreshProfile();
    }
  }, [storeProfile]);

  const [storageQuota, setStorageQuota] = useState<StorageQuotaData | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [cleaningStorage, setCleaningStorage] = useState(false);

  const fetchStorageQuota = async () => {
    setLoadingQuota(true);
    try {
      const res = await fetch("/api/storage/quota");
      if (res.ok) {
        const data = await res.json();
        if (data.usage) {
          setStorageQuota(data.usage);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch storage quota:", err);
    } finally {
      setLoadingQuota(false);
    }
  };

  const handleCleanupStorage = async () => {
    setCleaningStorage(true);
    try {
      const res = await fetch("/api/storage/cleanup", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.usage) setStorageQuota(data.usage);
        if (data.deletedCount > 0) {
          useToastStore.getState().addToast(
            `Storage cleaned! Removed ${data.deletedCount} unreferenced files (${formatBytes(data.freedBytes)} freed).`,
            "success"
          );
        } else {
          useToastStore.getState().addToast("Storage clean! No orphaned files found.", "info");
        }
      } else {
        useToastStore.getState().addToast(data.error || "Cleanup failed", "error");
      }
    } catch {
      useToastStore.getState().addToast("Failed to clean up storage", "error");
    } finally {
      setCleaningStorage(false);
    }
  };

  useEffect(() => {
    fetchStorageQuota();
  }, []);

  const handleSignOut = async () => {
    try {
      await useUserStore.getState().signOut();
    } catch {}
    window.location.href = "/login?force=true";
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

        {/* Storage Quota & Usage Dashboard */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-3 pb-2.5 sm:pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-foreground">Storage & Cloud Quota</h2>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                  Free Tier: 30 MB per user allocation across C programs, version history, and media attachments.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchStorageQuota}
              disabled={loadingQuota}
              className="p-1 sm:p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
              title="Refresh Storage Quota"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingQuota ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>

          {/* Warning / Full Alert Banners */}
          {storageQuota?.isExhausted && (
            <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Storage Limit Reached (100% Full)</p>
                <p className="text-[11px] text-rose-400 mt-0.5">
                  You have consumed all 30 MB of your account quota. Further C code saves and image uploads are blocked until space is freed. Delete older programs or click Clean Up below.
                </p>
              </div>
            </div>
          )}

          {storageQuota && storageQuota.isWarning && !storageQuota.isExhausted && (
            <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Storage Usage Warning ({storageQuota.totalPercent}% used)</p>
                <p className="text-[11px] text-amber-400 mt-0.5">
                  You have used over 80% of your 30 MB storage limit. Consider deleting unused code versions or running cleanup to keep your workspace running smoothly.
                </p>
              </div>
            </div>
          )}

          {/* Overall Progress Bar & Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {storageQuota ? formatBytes(storageQuota.totalBytes) : "—"} used
                </span>
                <span className="text-muted-foreground">of 30.00 MB total</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    (storageQuota?.totalPercent || 0) >= 100
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-500"
                      : (storageQuota?.totalPercent || 0) >= 80
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {storageQuota ? `${storageQuota.totalPercent}%` : "—"}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  {storageQuota ? `${formatBytes(storageQuota.remainingTotalBytes)} free` : ""}
                </span>
              </div>
            </div>

            {/* Segmented / Multi-colored Progress Bar */}
            <div className="w-full h-3 rounded-full bg-secondary/80 overflow-hidden flex p-0.5 border border-border/60">
              <div
                className="h-full bg-indigo-500 rounded-l-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    storageQuota ? (storageQuota.codeBytes / storageQuota.totalLimitBytes) * 100 : 0
                  )}%`,
                }}
                title={`Code: ${storageQuota ? formatBytes(storageQuota.codeBytes) : "0 B"}`}
              />
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    storageQuota ? (storageQuota.mediaBytes / storageQuota.totalLimitBytes) * 100 : 0
                  )}%`,
                }}
                title={`Media: ${storageQuota ? formatBytes(storageQuota.mediaBytes) : "0 B"}`}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] sm:text-[11px] text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                <span>C Programs & Versions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                <span>Profile & Post Media</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="w-2.5 h-2.5 rounded-sm bg-secondary border border-border inline-block" />
                <span>Remaining Free</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Code & Versions (10 MB allocation) */}
            <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-foreground">C Programs</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Max 10 MB</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-foreground">
                {storageQuota ? formatBytes(storageQuota.codeBytes) : "—"}
              </p>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, storageQuota ? storageQuota.codePercent : 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {storageQuota
                  ? `${storageQuota.programsCount} programs · ${storageQuota.versionsCount} version checkpoints`
                  : "Loading..."}
              </p>
            </div>

            {/* 2. Profile Photo (2 MB allocation) */}
            <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-400">
                  <User className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-foreground">Profile Avatar</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Max 2 MB</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-foreground">
                {storageQuota ? formatBytes(storageQuota.avatarBytes) : "—"}
              </p>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      storageQuota ? (storageQuota.avatarBytes / (2 * 1024 * 1024)) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Auto-compressed square WebP image
              </p>
            </div>

            {/* 3. Post Media & Attachments (18 MB allocation) */}
            <div className="p-3 sm:p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-fuchsia-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold text-foreground">Post Media</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Max 18 MB</span>
              </div>
              <p className="text-sm sm:text-base font-extrabold text-foreground">
                {storageQuota ? formatBytes(storageQuota.postMediaBytes) : "—"}
              </p>
              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-fuchsia-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      storageQuota ? (storageQuota.postMediaBytes / (18 * 1024 * 1024)) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {storageQuota ? `${storageQuota.mediaFilesCount} uploaded media files` : "Loading..."}
              </p>
            </div>
          </div>

          {/* Orphaned Cleanup Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div>
              <p className="text-xs font-semibold text-foreground">Storage Maintenance & Orphan Cleanup</p>
              <p className="text-[11px] text-muted-foreground">
                Detects and permanently removes superseded avatars or unattached media files to reclaim quota.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCleanupStorage}
              disabled={cleaningStorage}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-primary ${cleaningStorage ? "animate-spin" : ""}`} />
              <span>{cleaningStorage ? "Cleaning..." : "Clean Up Orphaned Files"}</span>
            </button>
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
