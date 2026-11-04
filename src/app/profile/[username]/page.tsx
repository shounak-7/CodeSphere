"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/client";
import { PostCard, Post } from "@/components/feed/PostCard";
import { ScrollableNav } from "@/components/ui/ScrollableNav";
import {
  User,
  MapPin,
  Calendar,
  Code2,
  FolderArchive,
  MessageSquare,
  UserPlus,
  UserCheck,
  UserMinus,
  Edit3,
  ExternalLink,
  Share2,
  Camera,
  Upload,
  X,
  Check,
  Users,
  Sparkles,
  Search,
  Loader2,
  Globe,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToastStore } from "@/lib/store/useToastStore";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { VerifiedBadge, isTeamAccount, isVerifiedAccount } from "@/components/ui/VerifiedBadge";
import { useUserStore } from "@/lib/store/useUserStore";

interface ProfileData {
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    college?: string;
    skills?: string[];
    is_verified?: boolean;
    created_at?: string;
  };
  isOwner: boolean;
  isFollowing: boolean;
  isFollowedBy?: boolean;
  stats: {
    followersCount: number;
    followingCount: number;
    programsCount: number;
    postsCount: number;
  };
  programs: any[];
  posts: Post[];
  collections: any[];
}

interface NetworkUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  is_following: boolean;
  is_followed_by: boolean;
  is_self: boolean;
  is_verified?: boolean;
}

const cachedProfileData: Record<string, ProfileData> = {};

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const { username } = use(params);
  const searchParams = useSearchParams();
  const shouldOpenEdit = searchParams.get("edit") === "true";

  const [data, setData] = useState<ProfileData | null>(() => cachedProfileData[username] || null);
  const [loading, setLoading] = useState(() => !cachedProfileData[username]);
  const [activeTab, setActiveTab] = useState<"posts" | "programs" | "collections">("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);
  const [followersCount, setFollowersCount] = useState(() => cachedProfileData[username]?.stats?.followersCount || 0);
  const [followingCount, setFollowingCount] = useState(() => cachedProfileData[username]?.stats?.followingCount || 0);
  const storeUser = useUserStore((s) => s.user);
  const storeProfile = useUserStore((s) => s.profile);
  const [currentUser, setCurrentUser] = useState<{ id: string; username?: string } | null>(() => {
    if (storeUser) {
      return {
        id: storeUser.id,
        username: storeProfile?.username || storeUser.email?.split("@")[0] || "",
      };
    }
    return null;
  });
  const [verifying, setVerifying] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(shouldOpenEdit);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Followers & Following Network Modal State
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [networkTab, setNetworkTab] = useState<"followers" | "following">("followers");
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkUsers, setNetworkUsers] = useState<{
    followers: NetworkUser[];
    following: NetworkUser[];
  }>({ followers: [], following: [] });
  const [networkSearch, setNetworkSearch] = useState("");
  const [modalFollowActionLoading, setModalFollowActionLoading] = useState<Record<string, boolean>>({});

  const fetchProfile = async () => {
    try {
      const endpoint = username === "me" ? "/api/profiles/me" : `/api/profiles/${username}`;
      const res = await fetch(endpoint);
      if (res.status === 401 && username === "me") {
        router.replace("/login?redirectTo=/profile/me");
        return;
      }
      const resData = await res.json();
      if (resData.profile) {
        cachedProfileData[username] = resData;
        if (resData.profile.username) {
          cachedProfileData[resData.profile.username] = resData;
        }
        setData(resData);
        setIsFollowing(Boolean(resData.isFollowing));
        setIsFollowedBy(Boolean(resData.isFollowedBy));
        setFollowersCount(resData.stats?.followersCount || 0);
        setFollowingCount(resData.stats?.followingCount || 0);

        if (username === "me" || resData.isOwner) {
          setCurrentUser({ id: resData.profile.id, username: resData.profile.username });
        }

        // Pre-fill edit modal with existing values
        setEditFullName(resData.profile.full_name || "");
        setEditUsername(resData.profile.username || "");
        setEditBio(resData.profile.bio || "");
        setEditCollege(resData.profile.college || "");
        setEditSkills((resData.profile.skills || []).join(", "));
        setEditAvatarUrl(resData.profile.avatar_url || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch profile data immediately without blocking
    fetchProfile();

    // 2. If viewing another profile, retrieve current user from cache/store
    if (username !== "me" && storeUser) {
      const fallbackUsername =
        storeProfile?.username ||
        (storeUser.user_metadata?.user_name as string) ||
        (storeUser.user_metadata?.username as string) ||
        storeUser.email?.split("@")[0] ||
        "";
      setCurrentUser({ id: storeUser.id, username: fallbackUsername });
    }
  }, [username, storeUser, storeProfile]);

  const handleToggleVerifyUser = async () => {
    if (!data?.profile) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/profiles/${data.profile.username}/verify`, { method: "POST" });
      const verifyData = await res.json();
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  is_verified: verifyData.is_verified,
                },
              }
            : null
        );
        useToastStore.getState().addToast(
          verifyData.is_verified
            ? `Granted official verified badge to @${data.profile.username}!`
            : `Revoked verification badge from @${data.profile.username}.`,
          "success"
        );
      } else {
        useToastStore.getState().addToast(verifyData.error || "Failed to update verification", "error");
      }
    } catch {
      useToastStore.getState().addToast("Network error updating verification", "error");
    } finally {
      setVerifying(false);
    }
  };

  const fetchRelationships = async () => {
    if (networkUsers.followers.length === 0 && networkUsers.following.length === 0) {
      setNetworkLoading(true);
    }
    try {
      const targetUser = data?.profile.username || username;
      const res = await fetch(`/api/profiles/${targetUser}/relationships`);
      const relData = await res.json();
      if (relData.followers && relData.following) {
        setNetworkUsers(relData);
      }
    } finally {
      setNetworkLoading(false);
    }
  };

  const openNetworkModal = (tab: "followers" | "following") => {
    setNetworkTab(tab);
    setNetworkSearch("");
    setIsNetworkModalOpen(true);
    fetchRelationships();
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      useToastStore.getState().addToast("Please sign in to follow developers", "warning");
      return;
    }
    if (isFollowing) {
      useToastStore.getState().openConfirm({
        title: `Unfollow @${data?.profile.username || username}?`,
        message: `Are you sure you want to unfollow @${data?.profile.username || username}?`,
        confirmLabel: "Unfollow",
        isDestructive: true,
        onConfirm: () => executeToggleFollow(),
      });
    } else {
      await executeToggleFollow();
    }
  };

  const executeToggleFollow = async () => {
    const nextVal = !isFollowing;
    setIsFollowing(nextVal);
    setFollowersCount((prev) => (nextVal ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await fetch(`/api/profiles/${data?.profile.username || username}/follow`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) {
        setIsFollowing(!nextVal);
        setFollowersCount((prev) => (!nextVal ? prev + 1 : Math.max(0, prev - 1)));
        useToastStore.getState().addToast(resData.error || "Failed to update follow", "error");
      } else {
        setIsFollowing(resData.following);
        useToastStore.getState().addToast(
          resData.following ? `Following @${data?.profile.username}` : `Unfollowed @${data?.profile.username}`,
          "info"
        );
      }
    } catch {
      setIsFollowing(!nextVal);
      setFollowersCount((prev) => (!nextVal ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleModalUserFollow = async (targetUsername: string) => {
    if (!currentUser) {
      useToastStore.getState().addToast("Please sign in to follow developers", "warning");
      return;
    }
    setModalFollowActionLoading((prev) => ({ ...prev, [targetUsername]: true }));
    try {
      const res = await fetch(`/api/profiles/${targetUsername}/follow`, {
        method: "POST",
      });
      const resData = await res.json();
      if (res.ok) {
        const newFollowingState = resData.following;
        setNetworkUsers((prev) => {
          const updateList = (list: NetworkUser[]) =>
            list.map((u) => (u.username.toLowerCase() === targetUsername.toLowerCase() ? { ...u, is_following: newFollowingState } : u));
          return {
            followers: updateList(prev.followers),
            following: updateList(prev.following),
          };
        });

        // If toggling the main profile user
        if (data?.profile.username.toLowerCase() === targetUsername.toLowerCase()) {
          setIsFollowing(newFollowingState);
          setFollowersCount((prev) => (newFollowingState ? prev + 1 : Math.max(0, prev - 1)));
        }

        useToastStore.getState().addToast(
          newFollowingState ? `Now following @${targetUsername}` : `Unfollowed @${targetUsername}`,
          "info"
        );
      }
    } finally {
      setModalFollowActionLoading((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  const handleRemoveFollower = async (targetUsername: string) => {
    setModalFollowActionLoading((prev) => ({ ...prev, [targetUsername]: true }));
    try {
      const res = await fetch(`/api/profiles/${username}/relationships`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_follower",
          targetUsername,
        }),
      });
      const resData = await res.json();
      if (res.ok) {
        setNetworkUsers((prev) => ({
          ...prev,
          followers: prev.followers.filter((f) => f.username.toLowerCase() !== targetUsername.toLowerCase()),
        }));
        setFollowersCount((prev) => Math.max(0, prev - 1));
        useToastStore.getState().addToast(`Removed @${targetUsername} from followers`, "info");
      } else {
        useToastStore.getState().addToast(resData.error || "Failed to remove follower", "error");
      }
    } catch {
      useToastStore.getState().addToast("Network error while removing follower", "error");
    } finally {
      setModalFollowActionLoading((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  const handleUnfollowUser = async (targetUsername: string) => {
    setModalFollowActionLoading((prev) => ({ ...prev, [targetUsername]: true }));
    try {
      const res = await fetch(`/api/profiles/${username}/relationships`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unfollow",
          targetUsername,
        }),
      });
      const resData = await res.json();
      if (res.ok) {
        setNetworkUsers((prev) => ({
          followers: prev.followers.map((f) =>
            f.username.toLowerCase() === targetUsername.toLowerCase() ? { ...f, is_following: false } : f
          ),
          following: isOwner
            ? prev.following.filter((f) => f.username.toLowerCase() !== targetUsername.toLowerCase())
            : prev.following.map((f) =>
                f.username.toLowerCase() === targetUsername.toLowerCase() ? { ...f, is_following: false } : f
              ),
        }));

        if (isOwner) {
          setFollowingCount((prev) => Math.max(0, prev - 1));
        }
        if (data?.profile.username.toLowerCase() === targetUsername.toLowerCase()) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        }

        useToastStore.getState().addToast(`Unfollowed @${targetUsername}`, "info");
      } else {
        useToastStore.getState().addToast(resData.error || "Failed to unfollow", "error");
      }
    } catch {
      useToastStore.getState().addToast("Network error while unfollowing", "error");
    } finally {
      setModalFollowActionLoading((prev) => ({ ...prev, [targetUsername]: false }));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    useToastStore.getState().addToast("Profile URL copied to clipboard!", "success");
  };

  // Image Upload Handler (reads file as Base64 Data URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      useToastStore.getState().addToast("Image size exceeds 2MB limit", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const skillsArray = editSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editFullName.trim(),
          username: editUsername.trim(),
          bio: editBio.trim(),
          college: editCollege.trim(),
          skills: skillsArray,
          avatar_url: editAvatarUrl,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update profile");
      }

      // Update active state immediately
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            full_name: resData.profile.full_name,
            username: resData.profile.username,
            bio: resData.profile.bio,
            college: resData.profile.college,
            skills: resData.profile.skills,
            avatar_url: resData.profile.avatar_url,
          },
        };
      });

      // Dispatch global profile update event so Navbar updates immediately without reload!
      window.dispatchEvent(new CustomEvent("profile-updated"));

      setIsEditModalOpen(false);
      useToastStore.getState().addToast("Profile and avatar updated successfully!", "success");
    } catch (err) {
      useToastStore.getState().addToast(
        err instanceof Error ? err.message : "Failed to update profile",
        "error"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Filter network list in modal by search query
  const filteredNetworkUsers = useMemo(() => {
    const list = networkTab === "followers" ? networkUsers.followers : networkUsers.following;
    if (!networkSearch.trim()) return list;
    const q = networkSearch.toLowerCase();
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.full_name.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [networkTab, networkUsers, networkSearch]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-6">
          <div className="h-44 bg-secondary/80 rounded-2xl" />
          <div className="w-48 h-6 bg-secondary/80 rounded" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-20 text-center">
          <User className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <h2 className="text-xl font-bold">Developer Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The developer profile @{username} could not be loaded.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20"
          >
            Explore Developers
          </Link>
        </div>
      </AppShell>
    );
  }

  const { profile, isOwner, stats, programs, posts, collections } = data;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3.5 sm:py-6 lg:py-8">
        {/* Profile Header Banner Card */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-6 shadow-sm mb-3.5 sm:mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-6">
            {/* Avatar & Identifiers */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative group">
                <UserAvatar
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username}
                  size="lg"
                  className="sm:w-16 sm:h-16 ring-4 ring-primary/20 shadow-md"
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-semibold"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-4 sm:w-5 h-4 sm:h-5 mb-0.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground">
                    {profile.full_name || profile.username}
                  </h1>
                  {isVerifiedAccount(profile) && (
                    <VerifiedBadge size="md" isTeam={isTeamAccount(profile.username)} />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">@{profile.username}</p>
                {profile.college && (
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    <MapPin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary" />
                    <span>{profile.college}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Actions: Share, Edit, or Follow / Follow Back + Team Verification */}
            <div className="flex items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-xs"
                title="Share Profile"
              >
                <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </button>

              {/* Official Team Admin Action: Grant / Revoke Verification */}
              {currentUser?.id && (
                isTeamAccount(currentUser.username) ||
                currentUser.username?.toLowerCase() === "shounak" ||
                currentUser.id === "d8c1828a-8a3f-432a-bd06-477029bc21e2" ||
                currentUser.id === "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1"
              ) && !isOwner && !isTeamAccount(profile.username) && (
                <button
                  type="button"
                  onClick={handleToggleVerifyUser}
                  disabled={verifying}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                    profile.is_verified
                      ? "border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                      : "border border-indigo-500/30 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                  title={profile.is_verified ? "Revoke Verified Badge" : "Grant Official Verified Badge"}
                >
                  <VerifiedBadge size="sm" showTooltip={false} />
                  <span>
                    {verifying
                      ? "Updating..."
                      : profile.is_verified
                      ? "Revoke"
                      : "Verify User"}
                  </span>
                </button>
              )}

              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-border bg-primary text-primary-foreground hover:bg-primary/90 text-[11px] sm:text-xs font-bold transition-all shadow-sm shadow-primary/20 cursor-pointer"
                >
                  <Edit3 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  onMouseEnter={() => setIsHoveringFollow(true)}
                  onMouseLeave={() => setIsHoveringFollow(false)}
                  className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                    isFollowing
                      ? isHoveringFollow
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20"
                        : "bg-secondary text-foreground border border-border"
                      : isFollowedBy
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-md shadow-blue-500/25"
                      : "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25"
                  }`}
                >
                  {isFollowing ? (
                    isHoveringFollow ? (
                      <>
                        <UserMinus className="w-3 sm:w-3.5 h-3 sm:w-3.5 text-rose-500" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3 sm:w-3.5 h-3 sm:w-3.5 text-emerald-400" />
                        <span>Following</span>
                      </>
                    )
                  ) : isFollowedBy ? (
                    <>
                      <UserPlus className="w-3 sm:w-3.5 h-3 sm:w-3.5" />
                      <span>Follow Back</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 sm:w-3.5 h-3 sm:w-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Bio */}
          {profile.bio && (
            <p className="mt-2.5 sm:mt-4 text-xs sm:text-sm text-foreground/90 leading-relaxed border-t border-border pt-2.5 sm:pt-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* User Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2.5 sm:mt-4">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Interactive Stats Bar - Clicking Followers / Following opens Network Modal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-4 mt-3.5 sm:mt-6 pt-3 sm:pt-4 border-t border-border text-center">
            {/* Followers Button */}
            <button
              type="button"
              onClick={() => openNetworkModal("followers")}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-secondary/30 hover:bg-secondary/70 border border-transparent hover:border-primary/30 transition-all cursor-pointer group"
              title="Click to view followers"
            >
              <p className="text-sm sm:text-lg font-bold text-foreground font-mono group-hover:text-primary transition-colors">
                {followersCount}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <Users className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary/70" />
                <span>Followers</span>
              </p>
            </button>

            {/* Following Button */}
            <button
              type="button"
              onClick={() => openNetworkModal("following")}
              className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-secondary/30 hover:bg-secondary/70 border border-transparent hover:border-primary/30 transition-all cursor-pointer group"
              title="Click to view following"
            >
              <p className="text-sm sm:text-lg font-bold text-foreground font-mono group-hover:text-primary transition-colors">
                {followingCount}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors flex items-center justify-center gap-1">
                <UserCheck className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary/70" />
                <span>Following</span>
              </p>
            </button>

            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-secondary/30">
              <p className="text-sm sm:text-lg font-bold text-foreground font-mono">{programs.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Programs</p>
            </div>
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-secondary/30">
              <p className="text-sm sm:text-lg font-bold text-foreground font-mono">{posts.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Posts</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Left/Right Arrows */}
        <div className="mb-3.5 sm:mb-6 border-b border-border pb-1.5 sm:pb-2">
          <ScrollableNav className="gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "posts"
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Posts ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("programs")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "programs"
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Programs ({programs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("collections")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "collections"
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Collections ({collections.length})</span>
            </button>
          </ScrollableNav>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="text-sm font-semibold text-foreground">No posts published yet.</p>
                <p className="text-xs mt-1">Posts shared in the community feed will appear here.</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  currentUsername={currentUser?.username}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "programs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
                <Code2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="text-sm font-semibold text-foreground">No public C programs published yet.</p>
                <p className="text-xs mt-1">Programs created in your workspace can be set to public to appear here.</p>
              </div>
            ) : (
              programs.map((prog) => (
                <div
                  key={prog.id}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-1.5 min-w-0 mr-2">
                        <span className="font-bold text-xs sm:text-sm text-foreground truncate">{prog.title}</span>
                        {prog.visibility === "private" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                            <Globe className="w-2.5 h-2.5" /> Public
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                        {prog.category || "DSA"}
                      </span>
                    </div>
                    {prog.description && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                        {prog.description}
                      </p>
                    )}
                    {prog.tags && prog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {prog.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground pt-2 sm:pt-3 border-t border-border/50">
                    <span>{formatDate(prog.created_at)}</span>
                    <Link
                      href={`/workspace?programId=${prog.id}`}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open Code</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "collections" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {collections.length === 0 ? (
              <div className="col-span-2 rounded-xl sm:rounded-2xl border border-border bg-card p-6 sm:p-12 text-center text-muted-foreground">
                <FolderArchive className="w-7 sm:w-8 h-7 sm:h-8 mx-auto mb-2 opacity-40 text-primary" />
                <p className="text-xs sm:text-sm font-semibold text-foreground">No public collections created yet.</p>
                <p className="text-[11px] sm:text-xs mt-1">Collections of lab assignments and algorithms will appear here.</p>
              </div>
            ) : (
              collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.id}`}
                  className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border bg-card hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate mr-2">
                      {col.title}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                      {col.programs_count ?? col.collection_programs?.[0]?.count ?? 0} programs
                    </span>
                  </div>
                  {col.description && (
                    <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mb-2 sm:mb-3">{col.description}</p>
                  )}
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                    Created {formatDate(col.created_at)}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {/* Followers & Following Network Modal (Everyone can check who they followed and who follows them back) */}
      {isNetworkModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header with Tabs */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNetworkTab("followers")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    networkTab === "followers"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  Followers ({followersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkTab("following")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    networkTab === "following"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  Following ({followingCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsNetworkModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Real-time search inside modal */}
            <div className="p-3 border-b border-border bg-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={networkSearch}
                  onChange={(e) => setNetworkSearch(e.target.value)}
                  placeholder={`Search ${networkTab}...`}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Modal List Body */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border/60 p-2">
              {networkLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs">Loading developers...</span>
                </div>
              ) : filteredNetworkUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  {networkSearch ? "No matching developers found" : `No ${networkTab} yet`}
                </div>
              ) : (
                filteredNetworkUsers.map((u) => {
                  const isLoadingAction = modalFollowActionLoading[u.username];

                  return (
                    <div
                      key={u.id || u.username}
                      className="p-2.5 rounded-xl hover:bg-secondary/40 flex items-center justify-between gap-3 transition-colors"
                    >
                      <Link
                        href={`/profile/${u.username}`}
                        onClick={() => setIsNetworkModalOpen(false)}
                        className="flex items-center gap-3 min-w-0 flex-1 group"
                      >
                        <UserAvatar
                          src={u.avatar_url}
                          alt={u.full_name || u.username}
                          size="md"
                          className="ring-1 ring-border group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {u.full_name || u.username}
                            </p>
                            {isVerifiedAccount(u) && (
                              <VerifiedBadge size="sm" isTeam={isTeamAccount(u.username)} />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            @{u.username}
                          </p>
                          {u.bio && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                              {u.bio}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Action Buttons: You badge vs Follow / Following / Remove */}
                      <div className="flex items-center gap-2">
                        {u.is_self && currentUser ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-secondary text-muted-foreground border border-border">
                            You
                          </span>
                        ) : (
                          <>
                            {/* Follow / Following / Follow Back toggle button */}
                            <button
                              type="button"
                              disabled={isLoadingAction}
                              onClick={() => {
                                if (u.is_following) {
                                  useToastStore.getState().openConfirm({
                                    title: `Unfollow @${u.username}?`,
                                    message: `Are you sure you want to unfollow @${u.username}? You will stop seeing their updates in your feed.`,
                                    confirmLabel: "Unfollow",
                                    isDestructive: true,
                                    onConfirm: () => handleUnfollowUser(u.username),
                                  });
                                } else {
                                  handleToggleModalUserFollow(u.username);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                                u.is_following
                                  ? "bg-secondary hover:bg-rose-500/10 text-foreground hover:text-rose-500 border border-border hover:border-rose-500/30"
                                  : u.is_followed_by
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95"
                                  : "bg-primary text-white hover:bg-primary/90"
                              }`}
                            >
                              {isLoadingAction ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : u.is_following ? (
                                <span>Following</span>
                              ) : u.is_followed_by ? (
                                <span>Follow Back</span>
                              ) : (
                                <span>Follow</span>
                              )}
                            </button>

                            {/* Option for profile owner to remove people from their followers list with confirmation */}
                            {isOwner && networkTab === "followers" && (
                              <button
                                type="button"
                                disabled={isLoadingAction}
                                onClick={() => {
                                  useToastStore.getState().openConfirm({
                                    title: `Remove @${u.username}?`,
                                    message: `Are you sure you want to remove @${u.username} from your followers? They will no longer follow your activity.`,
                                    confirmLabel: "Remove Follower",
                                    isDestructive: true,
                                    onConfirm: () => handleRemoveFollower(u.username),
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-secondary hover:bg-rose-500/15 text-muted-foreground hover:text-rose-500 border border-border hover:border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                title="Remove from your followers"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Edit Profile & PFP Modal */}
      {isEditModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Edit Developer Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Profile Picture Upload Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-secondary/40 border border-border">
                <UserAvatar
                  src={editAvatarUrl}
                  alt={editFullName || editUsername}
                  size="xl"
                  className="ring-2 ring-primary/40 shrink-0"
                />

                <div className="flex-1 space-y-2">
                  <p className="text-xs font-bold text-foreground">Profile Picture (PFP)</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>

                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl("")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <input
                    type="url"
                    value={editAvatarUrl.startsWith("data:") ? "" : editAvatarUrl}
                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="w-full h-8 px-2.5 text-xs rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full h-9 px-3 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Unique Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="username"
                    className="w-full h-9 px-3 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Bio / Developer Headline
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the community about yourself, your C interests, or projects..."
                  className="w-full p-3 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* College & Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    College / Organization
                  </label>
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    placeholder="e.g. University / Tech Org"
                    className="w-full h-9 px-3 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="e.g. C11, Pointers, Linked Lists"
                    className="w-full h-9 px-3 text-xs rounded-xl bg-secondary border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/25 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}
    </AppShell>
  );
}
