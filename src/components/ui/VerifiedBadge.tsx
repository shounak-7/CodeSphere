"use client";

import { Check } from "lucide-react";
import { isTeamAccount } from "@/lib/utils";

export { isTeamAccount };

export function isVerifiedAccount(
  account?: { username?: string; is_verified?: boolean } | string | null,
  isVerifiedFlag?: boolean
): boolean {
  if (isVerifiedFlag === true) return true;
  if (!account) return false;
  if (typeof account === "string") {
    return isTeamAccount(account);
  }
  if (account.is_verified === true) return true;
  return isTeamAccount(account.username);
}

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
  isTeam?: boolean;
}

export function VerifiedBadge({
  size = "sm",
  className = "",
  showTooltip = true,
  isTeam = false,
}: VerifiedBadgeProps) {
  const sizeMap = {
    sm: "w-3.5 h-3.5 text-[9px]",
    md: "w-4 h-4 text-[10px]",
    lg: "w-5 h-5 text-xs",
  };

  const iconSizeMap = {
    sm: "w-2.5 h-2.5",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const tooltipText = isTeam
    ? "Official CodeSphere Team Account"
    : "Verified CodeSphere Developer";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white shadow-xs shadow-indigo-500/40 ring-1 ring-white/20 select-none flex-shrink-0 cursor-default ${sizeMap[size]} ${className}`}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      <Check className={`${iconSizeMap[size]} stroke-[3.5]`} />
    </span>
  );
}
