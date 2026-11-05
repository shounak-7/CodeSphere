import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamAccount } from "@/lib/utils";

let cachedVerified: {
  usernames: Set<string>;
  ids: Set<string>;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 300000; // 5 minutes in-memory cache (invalidated on verification change)

/**
 * Retrieve all verified user IDs and usernames across Supabase Auth, profiles table, and team accounts.
 */
export async function getVerifiedEntities(): Promise<{ usernames: Set<string>; ids: Set<string> }> {
  const now = Date.now();
  if (cachedVerified && now - cachedVerified.timestamp < CACHE_TTL_MS) {
    return cachedVerified;
  }

  const usernames = new Set<string>(["codesphere", "team"]);
  const ids = new Set<string>(["7bef2dac-45a9-4b55-b15b-f6df28bdc9f1"]);

  try {
    const admin = createAdminClient();
    const [authRes, profilesRes] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 100 }).catch(() => ({ data: { users: [] }, error: null })),
      admin.from("profiles").select("id, username, is_verified"),
    ]);

    const usernameMap = new Map<string, string>();
    if (profilesRes.data) {
      for (const p of profilesRes.data) {
        if (p.id && p.username) {
          const lower = p.username.toLowerCase();
          usernameMap.set(p.id, lower);
          if (p.is_verified) {
            ids.add(p.id);
            usernames.add(lower);
          }
        }
      }
    }

    if (authRes.data?.users) {
      for (const u of authRes.data.users) {
        const isVerified =
          u.user_metadata?.is_verified === true ||
          u.email === "team@codesphere.io" ||
          isTeamAccount(u.user_metadata?.username as string) ||
          isTeamAccount(u.user_metadata?.user_name as string);

        if (isVerified) {
          ids.add(u.id);
          const dbUsername = usernameMap.get(u.id);
          if (dbUsername) usernames.add(dbUsername);
          const metaUsername = (u.user_metadata?.user_name || u.user_metadata?.username) as string;
          if (metaUsername) usernames.add(metaUsername.toLowerCase());
          if (u.email) usernames.add(u.email.split("@")[0].toLowerCase());
        }
      }
    }
  } catch (err) {
    console.warn("Failed to refresh verified cache:", err);
  }

  cachedVerified = { usernames, ids, timestamp: now };
  return cachedVerified;
}

export function invalidateVerifiedCache() {
  cachedVerified = null;
}

/**
 * Universally check if an account or author is verified.
 */
export function checkIsVerified(
  user: { id?: string; username?: string; is_verified?: boolean } | null | undefined,
  verifiedData?: { usernames: Set<string>; ids: Set<string> }
): boolean {
  if (!user) return false;
  if (user.is_verified === true) return true;
  if (user.username && isTeamAccount(user.username)) return true;

  if (verifiedData) {
    if (user.id && verifiedData.ids.has(user.id)) return true;
    if (user.username && verifiedData.usernames.has(user.username.toLowerCase().trim())) return true;
  }

  if (user.username) {
    const clean = user.username.toLowerCase().trim();
    if (clean === "codesphere" || clean === "team") return true;
  }

  return false;
}
