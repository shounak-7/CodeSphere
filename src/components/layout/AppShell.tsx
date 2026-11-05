"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Home, Code2, Compass, FolderArchive, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showBottomNav?: boolean;
}

const mobileNavItems = [
  { name: "Home", href: "/feed", icon: Home },
  { name: "Workspace", href: "/workspace", icon: Code2 },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Collections", href: "/collections", icon: FolderArchive },
  { name: "Profile", href: "/profile/me", icon: User },
];

export function AppShell({
  children,
  showSidebar = true,
  showBottomNav,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  // Show bottom nav on mobile if explicitly enabled, or by default when showSidebar is true
  const shouldShowBottomNav = showBottomNav !== undefined ? showBottomNav : showSidebar;

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex flex-col bg-background text-foreground overflow-hidden overscroll-none">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isDesktopHidden={!showSidebar}
        />
        <main
          className={cn(
            "flex-1 min-w-0 min-h-0",
            pathname === "/workspace"
              ? "overflow-hidden flex flex-col"
              : "overflow-y-auto overflow-x-hidden",
            shouldShowBottomNav ? "pb-16 md:pb-0" : ""
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md screens only) */}
      {shouldShowBottomNav && (
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-card/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-1 md:hidden select-none shadow-lg"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/workspace" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer active:scale-95",
                  isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all",
                    isActive
                      ? "bg-primary/10 text-primary shadow-xs"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="leading-tight mt-0.5">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
