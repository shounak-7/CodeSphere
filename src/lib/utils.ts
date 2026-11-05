import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return "";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return "";
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

export function isTeamAccount(username?: string | null): boolean {
  if (!username) return false;
  const clean = username.toLowerCase().trim();
  return clean === "codesphere" || clean === "team";
}

export function extractPostMedia(
  rawContent: string,
  existingMediaUrl?: string | null
): { content: string; mediaUrl: string | null } {
  if (!rawContent) {
    return { content: "", mediaUrl: existingMediaUrl || null };
  }
  const mediaMatch = rawContent.match(/<!--media:(.+?)-->/);
  const mediaUrl = mediaMatch ? mediaMatch[1] : (existingMediaUrl || null);
  const content = rawContent.replace(/\n?<!--media:(.+?)-->/g, "").trim();
  return { content, mediaUrl };
}
