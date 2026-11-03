"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  iconClassName?: string;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

const iconSizes = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-10 h-10",
};

export function UserAvatar({
  src,
  alt = "User avatar",
  size = "md",
  className,
  iconClassName,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const containerSize = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  // Calculate initial letter if alt is a person or username
  const cleanAlt = (alt || "").trim();
  const hasLetter = cleanAlt && cleanAlt !== "User avatar" && cleanAlt !== "Profile" && cleanAlt !== "developer";
  const initial = hasLetter ? cleanAlt.charAt(0).toUpperCase() : null;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgError(true)}
        className={cn(
          containerSize,
          "rounded-full object-cover border border-border/80 shrink-0 select-none",
          className
        )}
      />
    );
  }

  if (initial) {
    const textSizes = {
      xs: "text-[10px]",
      sm: "text-xs",
      md: "text-sm",
      lg: "text-lg",
      xl: "text-2xl",
    };

    return (
      <div
        className={cn(
          containerSize,
          "rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs border border-white/20 select-none",
          textSizes[size] || textSizes.md,
          className
        )}
        aria-label={alt}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        containerSize,
        "rounded-full bg-slate-200/80 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 border border-slate-300/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-xs",
        className
      )}
      aria-label={alt}
    >
      <User className={cn(iconSize, iconClassName)} />
    </div>
  );
}
