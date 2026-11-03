"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Code2,
  Terminal,
  Compass,
  FolderArchive,
  MessageSquare,
  Bookmark,
  User,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isDesktopHidden?: boolean;
}

export const navigationItems = [
  { name: "Home Feed", href: "/feed", icon: Home },
  { name: "My Workspace", href: "/workspace", icon: Code2 },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Public Collections", href: "/collections", icon: FolderArchive },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { name: "My Profile", href: "/profile/me", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose, isDesktopHidden = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-xs",
            isDesktopHidden ? "lg:hidden" : "md:hidden"
          )}
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-14 sm:top-16 bottom-0 left-0 z-40 w-64 flex-shrink-0 border-r border-border bg-card flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-xs",
          isDesktopHidden
            ? "lg:hidden"
            : "md:relative md:top-0 md:h-full md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-1 overflow-y-auto h-full">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Navigation
          </p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/workspace" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group active:scale-[0.98] cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
