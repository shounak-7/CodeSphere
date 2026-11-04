"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  college?: string;
  skills?: string[];
  is_verified?: boolean;
}

interface UserState {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  initialized: boolean;
  setUser: (user: UserState["user"]) => void;
  setProfile: (profile: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => () => void;
}

let authInitPromise: Promise<void> | null = null;
let profileFetchPromise: Promise<void> | null = null;

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    if (profileFetchPromise) {
      return profileFetchPromise;
    }

    profileFetchPromise = (async () => {
      try {
        const res = await fetch("/api/profiles/me?view=compact");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            set({ profile: data.profile });
          }
        }
      } catch {
        // Silently preserve existing cached profile
      } finally {
        profileFetchPromise = null;
      }
    })();

    return profileFetchPromise;
  },

  signOut: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    set({ user: null, profile: null, isLoading: false });
  },

  initialize: () => {
    if (typeof window === "undefined") {
      return () => {};
    }

    if (get().initialized) {
      return () => {};
    }

    const supabase = createClient();

    if (!authInitPromise) {
      authInitPromise = (async () => {
        try {
          // 1. Instant local session check (0ms memory/cookie read)
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = session.user;
            const fallbackUsername =
              (u.user_metadata?.user_name as string) ||
              (u.user_metadata?.username as string) ||
              u.email?.split("@")[0] ||
              "developer";
            const fallbackFullName =
              (u.user_metadata?.full_name as string) ||
              (u.user_metadata?.name as string) ||
              fallbackUsername;
            const fallbackAvatar =
              (u.user_metadata?.avatar_url as string) ||
              (u.user_metadata?.picture as string) ||
              "";

            set({
              user: u,
              profile: {
                id: u.id,
                username: fallbackUsername,
                full_name: fallbackFullName,
                avatar_url: fallbackAvatar,
              },
              isLoading: false,
              initialized: true,
            });

            // Asynchronously enrich with database profile in background without blocking UI
            get().refreshProfile();
          } else {
            set({ user: null, profile: null, isLoading: false, initialized: true });
          }
        } catch {
          set({ isLoading: false, initialized: true });
        } finally {
          authInitPromise = null;
        }
      })();
    }

    // 2. Subscribe to auth changes once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const fallbackUsername =
          (u.user_metadata?.user_name as string) ||
          (u.user_metadata?.username as string) ||
          u.email?.split("@")[0] ||
          "developer";
        const fallbackFullName =
          (u.user_metadata?.full_name as string) ||
          (u.user_metadata?.name as string) ||
          fallbackUsername;
        const fallbackAvatar =
          (u.user_metadata?.avatar_url as string) ||
          (u.user_metadata?.picture as string) ||
          "";

        set({
          user: u,
          profile: get().profile || {
            id: u.id,
            username: fallbackUsername,
            full_name: fallbackFullName,
            avatar_url: fallbackAvatar,
          },
          isLoading: false,
          initialized: true,
        });

        if (event === "SIGNED_IN") {
          get().refreshProfile();
        }
      } else if (event === "SIGNED_OUT") {
        set({ user: null, profile: null, isLoading: false, initialized: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },
}));
