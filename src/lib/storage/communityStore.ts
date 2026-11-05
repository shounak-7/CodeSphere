import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { getLocalPrograms } from "./workspaceStore";

export interface StoredPost {
  id: string;
  author_id: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  title?: string;
  content: string;
  post_type: "text" | "code" | "achievement" | "question" | "update";
  code_snippet?: string | null;
  media_url?: string | null;
  language?: string;
  program_id?: string | null;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface StoredComment {
  id: string;
  post_id: string;
  author_id: string;
  author: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  content: string;
  created_at: string;
}

export interface StoredLike {
  user_id: string;
  user_username?: string;
  post_id: string;
  created_at: string;
}

export interface StoredFollow {
  follower_id: string;
  follower_username?: string;
  following_id: string;
  following_username?: string;
  created_at: string;
}

export interface StoredBookmark {
  id: string;
  user_id: string;
  target_type: "post" | "program" | "collection";
  target_id: string;
  created_at: string;
}

export interface StoredProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  college?: string;
  skills?: string[];
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StoredNotification {
  id: string;
  recipient_id: string;
  recipient_username?: string;
  actor_id: string;
  actor: {
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  notification_type: "like" | "comment" | "follow";
  reference_id?: string;
  post_title?: string;
  comment_text?: string;
  is_read: boolean;
  created_at: string;
}

export interface NetworkUser {
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

export interface StoredCollectionProgram {
  id: string;
  title: string;
  description?: string;
  source_code: string;
  category?: string;
  tags?: string[];
  created_at?: string;
}

export interface StoredCollection {
  id: string;
  owner_id: string;
  owner: {
    id?: string;
    username: string;
    full_name: string;
    avatar_url: string;
    is_verified?: boolean;
  };
  title: string;
  description?: string;
  tags: string[];
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
  programs: StoredCollectionProgram[];
}

interface CommunityDB {
  posts: StoredPost[];
  comments: StoredComment[];
  likes: StoredLike[];
  follows: StoredFollow[];
  bookmarks: StoredBookmark[];
  profiles: StoredProfile[];
  notifications: StoredNotification[];
  collections?: StoredCollection[];
  deleted_collection_ids?: string[];
  verified_usernames?: string[];
}

const DATA_DIR = process.env.VERCEL || process.env.NODE_ENV === "production"
  ? join(tmpdir(), "codesphere-data")
  : join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "community.json");

const TEAM_PROFILE: StoredProfile = {
  id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
  username: "codesphere",
  full_name: "CodeSphere Team",
  is_verified: true,
  avatar_url: "",
  bio: "The official CodeSphere engineering team building the next-gen social coding workspace for C developers.",
  college: "CodeSphere HQ",
  skills: ["C11", "Compilers", "Distributed Systems", "Algorithms"],
  created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
};

const SEED_POSTS: StoredPost[] = [
  {
    id: "post-seed-1",
    author_id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
    author: {
      id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
      username: "codesphere",
      full_name: "CodeSphere Team",
      avatar_url: "",
    },
    title: "Welcome to CodeSphere Community!",
    content: "Write, save, run, and share your C algorithms with fellow developers worldwide. Attach C code snippets, discuss DSA solutions, and clone codes directly into your workspace.",
    post_type: "code",
    code_snippet: `#include <stdio.h>

// Recursive factorial function in C
long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int num = 5;
    printf("Factorial of %d = %lld\\n", num, factorial(num));
    return 0;
}`,
    language: "c",
    tags: ["recursion", "factorial", "beginner", "c11"],
    likes_count: 0,
    comments_count: 0,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

const SEED_COMMENTS: StoredComment[] = [];

const SEED_NOTIFICATIONS: StoredNotification[] = [
  {
    id: "notif-welcome-1",
    recipient_id: "default-user",
    recipient_username: "developer",
    actor_id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
    actor: {
      username: "codesphere",
      full_name: "CodeSphere Team",
      avatar_url: "",
    },
    notification_type: "follow",
    reference_id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

const SEED_COLLECTIONS: StoredCollection[] = [
  {
    id: "col-seed-bst",
    owner_id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
    owner: {
      id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
      username: "codesphere",
      full_name: "CodeSphere Team",
      avatar_url: "",
    },
    title: "Binary Search Tree Mastery",
    description: "Curated set of complete C implementations for BST operations: insertion, traversal, search, deletion, mirror, and node counters.",
    tags: ["bst", "trees", "dsa", "c11"],
    visibility: "public",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    programs: [
      {
        id: "prog-bst-mastery",
        title: "binary_search_tree.c",
        description: "Complete Binary Search Tree with interactive operations",
        source_code: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct node {\n    int data;\n    struct node *left;\n    struct node *right;\n} Node;\n\nNode* createNode(int val) {\n    Node* n = (Node*)malloc(sizeof(Node));\n    n->data = val;\n    n->left = n->right = NULL;\n    return n;\n}\n\nNode* insertNode(Node* root, int val) {\n    if (root == NULL) return createNode(val);\n    if (val < root->data) root->left = insertNode(root->left, val);\n    else if (val > root->data) root->right = insertNode(root->right, val);\n    return root;\n}\n\nvoid inorder(Node* root) {\n    if (root != NULL) {\n        inorder(root->left);\n        printf("%d ", root->data);\n        inorder(root->right);\n    }\n}\n\nint main() {\n    Node* root = NULL;\n    root = insertNode(root, 50);\n    insertNode(root, 30);\n    insertNode(root, 70);\n    printf("Inorder Traversal: ");\n    inorder(root);\n    printf("\\n");\n    return 0;\n}`,
        category: "Trees",
        tags: ["bst", "recursion"],
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "col-seed-dsa-lab",
    owner_id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
    owner: {
      id: "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1",
      username: "codesphere",
      full_name: "CodeSphere Team",
      avatar_url: "",
    },
    title: "DSA Practical Exam Set",
    description: "Essential practical exam problems: Singly Linked Lists with pointer-safe operations, Stacks with Arrays, and Bubble Sort.",
    tags: ["exam-prep", "linked-list", "stacks", "c11"],
    visibility: "public",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    programs: [
      {
        id: "prog-singly-list",
        title: "singly_linked_list.c",
        description: "Singly linked list with head insertion and traversal",
        source_code: `#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int data;\n    struct Node* next;\n} Node;\n\nNode* insertHead(Node* head, int val) {\n    Node* n = (Node*)malloc(sizeof(Node));\n    n->data = val;\n    n->next = head;\n    return n;\n}\n\nvoid display(Node* head) {\n    Node* curr = head;\n    while (curr) {\n        printf("%d -> ", curr->data);\n        curr = curr->next;\n    }\n    printf("NULL\\n");\n}\n\nint main() {\n    Node* head = NULL;\n    head = insertHead(head, 30);\n    head = insertHead(head, 20);\n    head = insertHead(head, 10);\n    display(head);\n    return 0;\n}`,
        category: "Linked Lists",
        tags: ["pointers", "linked-list"],
        created_at: new Date().toISOString(),
      },
    ],
  },
];

async function ensureDB(): Promise<CommunityDB> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const content = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(content) as CommunityDB;
    const profiles = parsed.profiles || [];

    // Ensure team profile exists
    if (!profiles.some((p) => p.username.toLowerCase() === "codesphere" || p.id === TEAM_PROFILE.id)) {
      profiles.unshift(TEAM_PROFILE);
    }

    // Clean up any self-follows that might have crept into DB earlier
    const follows = (parsed.follows || []).filter((f) => {
      const sameId = f.follower_id && f.following_id && f.follower_id === f.following_id;
      const sameUsername =
        f.follower_username &&
        f.following_username &&
        f.follower_username.toLowerCase() === f.following_username.toLowerCase();
      const codeSphereSelf =
        (f.follower_id === TEAM_PROFILE.id || f.follower_id === "user-codesphere") &&
        (f.following_id === TEAM_PROFILE.id || f.following_id === "user-codesphere");
      return !sameId && !sameUsername && !codeSphereSelf;
    });

    const verifiedUsernames = Array.from(
      new Set([
        "codesphere",
        "team",
        ...(parsed.verified_usernames || []),
        ...profiles.filter((p) => p.is_verified).map((p) => p.username.toLowerCase()),
      ])
    );

    const deletedCollectionIds = new Set(parsed.deleted_collection_ids || []);
    const rawCollections = Array.isArray(parsed.collections) ? parsed.collections : SEED_COLLECTIONS;
    const collections = rawCollections.filter((c) => !deletedCollectionIds.has(c.id));

    return {
      posts: parsed.posts || SEED_POSTS,
      comments: parsed.comments || [],
      likes: parsed.likes || [],
      follows,
      bookmarks: parsed.bookmarks || [],
      profiles,
      notifications: parsed.notifications || SEED_NOTIFICATIONS,
      collections,
      deleted_collection_ids: parsed.deleted_collection_ids || [],
      verified_usernames: verifiedUsernames,
    };
  } catch {
    const initial: CommunityDB = {
      posts: SEED_POSTS,
      comments: SEED_COMMENTS,
      likes: [],
      follows: [],
      bookmarks: [],
      profiles: [TEAM_PROFILE],
      notifications: SEED_NOTIFICATIONS,
      collections: SEED_COLLECTIONS,
      verified_usernames: ["codesphere", "team"],
    };
    await saveDB(initial);
    return initial;
  }
}

export function isUserVerified(username?: string | null, verifiedList?: string[]): boolean {
  if (!username) return false;
  const clean = username.toLowerCase().trim();
  if (clean === "codesphere" || clean === "team") return true;
  if (verifiedList && verifiedList.some((u) => u.toLowerCase() === clean)) return true;
  return false;
}

export async function isUserVerifiedAsync(usernameOrId?: string | null): Promise<boolean> {
  if (!usernameOrId) return false;
  const clean = usernameOrId.toLowerCase().trim();
  if (clean === "codesphere" || clean === "team") return true;
  const db = await ensureDB();
  if (db.verified_usernames?.some((u) => u.toLowerCase() === clean)) return true;
  const prof = db.profiles.find((p) => p.username.toLowerCase() === clean || p.id === usernameOrId);
  return Boolean(prof?.is_verified);
}

export async function toggleVerifiedStatus(
  targetUsernameOrId: string,
  authorizedByUsername: string
): Promise<{ is_verified: boolean; profile: StoredProfile }> {
  const db = await ensureDB();
  if (!db.verified_usernames) {
    db.verified_usernames = ["codesphere", "team"];
  }

  // Strict check: Only CodeSphere Team account has this authority
  const authClean = (authorizedByUsername || "").toLowerCase().trim();
  if (authClean !== "codesphere" && authClean !== "team") {
    throw new Error("Unauthorized: Only the CodeSphere Team account has the authority to grant or revoke verification badges.");
  }

  const targetClean = (targetUsernameOrId || "").toLowerCase().trim();
  if (!targetClean) {
    throw new Error("Target username is required.");
  }

  // Prevent revoking official team verification
  if (targetClean === "codesphere" || targetClean === "team") {
    throw new Error("The official CodeSphere Team account is permanently verified.");
  }

  // Find or create target profile
  let profile = db.profiles.find(
    (p) => p.username.toLowerCase() === targetClean || p.id === targetUsernameOrId
  );

  if (!profile) {
    profile = {
      id: `user-${targetClean}`,
      username: targetClean,
      full_name: targetClean.charAt(0).toUpperCase() + targetClean.slice(1),
      avatar_url: "",
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.push(profile);
  }

  const nextVerified = !Boolean(profile.is_verified);
  profile.is_verified = nextVerified;
  profile.updated_at = new Date().toISOString();

  // Update verified_usernames list
  const existingIdx = db.verified_usernames.findIndex((u) => u.toLowerCase() === targetClean);
  if (nextVerified && existingIdx === -1) {
    db.verified_usernames.push(targetClean);
  } else if (!nextVerified && existingIdx >= 0) {
    db.verified_usernames.splice(existingIdx, 1);
  }

  // Propagate is_verified in real time to existing posts, comments, collections & notifications
  for (const post of db.posts) {
    if (post.author?.username?.toLowerCase() === targetClean) {
      post.author.is_verified = nextVerified;
    }
  }
  for (const c of db.comments) {
    if (c.author?.username?.toLowerCase() === targetClean) {
      c.author.is_verified = nextVerified;
    }
  }
  if (db.collections) {
    for (const col of db.collections) {
      if (col.owner?.username?.toLowerCase() === targetClean) {
        col.owner.is_verified = nextVerified;
      }
    }
  }
  for (const n of db.notifications) {
    if (n.actor?.username?.toLowerCase() === targetClean) {
      n.actor.is_verified = nextVerified;
    }
  }

  await saveDB(db);
  return { is_verified: nextVerified, profile };
}

async function saveDB(db: CommunityDB): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

/**
 * Flexible follow matcher that handles IDs, usernames, and user- prefixed IDs
 */
export function matchesFollow(
  f: StoredFollow,
  follower: { id?: string; username?: string },
  following: { id?: string; username?: string }
): boolean {
  // Follower match check
  const followerUsername = follower.username?.toLowerCase();
  const fFollowerUsername = f.follower_username?.toLowerCase();

  const followerMatches =
    (follower.id && f.follower_id === follower.id) ||
    (followerUsername && fFollowerUsername === followerUsername) ||
    (followerUsername && (f.follower_id === followerUsername || f.follower_id === `user-${followerUsername}`)) ||
    (follower.id && fFollowerUsername && (follower.id === fFollowerUsername || follower.id === `user-${fFollowerUsername}`));

  if (!followerMatches) return false;

  // Following match check
  const followingUsername = following.username?.toLowerCase();
  const fFollowingUsername = f.following_username?.toLowerCase();

  const followingMatches =
    (following.id && f.following_id === following.id) ||
    (followingUsername && fFollowingUsername === followingUsername) ||
    (followingUsername && (f.following_id === followingUsername || f.following_id === `user-${followingUsername}`)) ||
    (following.id && fFollowingUsername && (following.id === fFollowingUsername || following.id === `user-${fFollowingUsername}`));

  return Boolean(followingMatches);
}

/**
 * Resolve profile details by ID or Username
 */
export async function getLocalProfile(userIdOrUsername: string): Promise<StoredProfile | null> {
  const db = await ensureDB();
  const search = userIdOrUsername.toLowerCase().trim();

  // 1. Direct profile lookup
  const fromProfiles = db.profiles.find(
    (p) =>
      p.id === userIdOrUsername ||
      p.username.toLowerCase() === search ||
      (search === "codesphere" && p.id === TEAM_PROFILE.id) ||
      (search === "team" && p.id === TEAM_PROFILE.id)
  );
  if (fromProfiles) return fromProfiles;

  // 2. Post author lookup
  const postAuthor = db.posts.find(
    (p) =>
      p.author_id === userIdOrUsername ||
      p.author?.username?.toLowerCase() === search
  );
  if (postAuthor?.author) {
    return {
      id: postAuthor.author_id,
      username: postAuthor.author.username,
      full_name: postAuthor.author.full_name,
      avatar_url: postAuthor.author.avatar_url || "",
      bio: "",
      college: "",
      skills: [],
    };
  }

  return null;
}

export async function getLocalPosts(tab = "latest", tag?: string, currentUserId?: string, currentUsername?: string) {
  const db = await ensureDB();
  let list = [...db.posts];

  if (tag) {
    const cleanTag = tag.toLowerCase().replace(/^#/, "");
    list = list.filter((p) => p.tags?.some((t) => t.toLowerCase() === cleanTag));
  }

  const effectiveUserId = currentUserId || "default-user";
  const userObj = { id: effectiveUserId, username: currentUsername };

  if (tab === "questions") {
    list = list.filter((p) => p.post_type === "question");
  } else if (tab === "following") {
    list = list.filter((p) => {
      const authorObj = { id: p.author_id, username: p.author?.username };
      return db.follows.some((f) => matchesFollow(f, userObj, authorObj));
    });
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Attach dynamic is_liked, is_bookmarked, is_following, and latest author avatar
  return list.map((p) => {
    // Check if liked
    const isLiked = db.likes.some(
      (l) =>
        (l.user_id === effectiveUserId || (currentUserId && l.user_id === currentUserId) || (currentUsername && l.user_username === currentUsername)) &&
        l.post_id === p.id
    );

    // Check if bookmarked
    const isBookmarked = (db.bookmarks || []).some(
      (b) =>
        (b.user_id === effectiveUserId || (currentUserId && b.user_id === currentUserId)) &&
        b.target_id === p.id
    );

    // Check if current user is following author
    const authorObj = { id: p.author_id, username: p.author?.username };
    const isFollowing = currentUserId || currentUsername
      ? db.follows.some((f) => matchesFollow(f, userObj, authorObj))
      : false;

    // Refresh author's latest PFP, full_name, and username from db.profiles
    const authorProfile = db.profiles.find(
      (prof) => prof.id === p.author_id || (p.author?.username && prof.username.toLowerCase() === p.author.username.toLowerCase())
    );

    const commentsCount = db.comments.filter((c) => c.post_id === p.id).length;
    const authorUsername = (authorProfile?.username || p.author?.username || "").toLowerCase();
    const currUser = (currentUsername || "").toLowerCase();
    const isSelfAuthor = Boolean(
      (currentUserId && (currentUserId === p.author_id || (p.author && currentUserId === p.author.id))) ||
      (currUser && authorUsername && (
        currUser === authorUsername ||
        (currUser === "codesphere" && authorUsername === "team") ||
        (currUser === "team" && authorUsername === "codesphere")
      ))
    );

    return {
      ...p,
      author: {
        id: p.author_id,
        username: authorProfile?.username || p.author?.username || "developer",
        full_name: authorProfile?.full_name || p.author?.full_name || "CodeSphere Developer",
        avatar_url: authorProfile?.avatar_url !== undefined ? authorProfile.avatar_url : (p.author?.avatar_url || ""),
        is_verified: isUserVerified(authorUsername, db.verified_usernames) || authorProfile?.is_verified === true,
      },
      is_liked: isLiked,
      is_bookmarked: isBookmarked,
      is_following: isFollowing,
      is_author: isSelfAuthor,
      likes_count: typeof p.likes_count === "number" ? p.likes_count : 0,
      comments_count: commentsCount,
    };
  });
}

export async function saveLocalPost(postData: Partial<StoredPost>): Promise<StoredPost> {
  const db = await ensureDB();
  const id = postData.id || randomUUID();
  const now = new Date().toISOString();

  // Try to find author's profile for updated avatar
  const authorProfile = db.profiles.find(
    (p) => p.id === postData.author_id || (postData.author?.username && p.username.toLowerCase() === postData.author.username.toLowerCase())
  );

  const authorId = postData.author_id || authorProfile?.id || "default-user";
  const authorUsername = authorProfile?.username || postData.author?.username || "developer";
  const authorFullName = authorProfile?.full_name || postData.author?.full_name || "CodeSphere Developer";
  const authorAvatar = authorProfile?.avatar_url || postData.author?.avatar_url || "";

  const newPost: StoredPost = {
    id,
    author_id: authorId,
    author: {
      id: authorId,
      username: authorUsername,
      full_name: authorFullName,
      avatar_url: authorAvatar,
    },
    title: postData.title || undefined,
    content: postData.content || "",
    post_type: postData.post_type || "text",
    code_snippet: postData.code_snippet || null,
    media_url: postData.media_url || null,
    language: postData.language || "c",
    program_id: postData.program_id || null,
    tags: postData.tags || [],
    likes_count: 0,
    comments_count: 0,
    created_at: now,
    updated_at: now,
  };

  db.posts.unshift(newPost);
  await saveDB(db);
  return newPost;
}

export async function deleteLocalPost(
  postId: string,
  currentUserId?: string,
  currentUsername?: string
): Promise<{ success: boolean; error?: string }> {
  const db = await ensureDB();
  const idx = db.posts.findIndex((p) => p.id === postId);
  if (idx === -1) return { success: false, error: "Post not found" };

  const post = db.posts[idx];
  const isMatch =
    (currentUserId && (post.author_id === currentUserId || post.author?.id === currentUserId)) ||
    (currentUsername && post.author?.username && post.author.username.toLowerCase() === currentUsername.toLowerCase());

  if (!isMatch) {
    return { success: false, error: "Unauthorized: only the author can delete this post" };
  }

  db.posts.splice(idx, 1);
  db.comments = db.comments.filter((c) => c.post_id !== postId);
  db.likes = db.likes.filter((l) => l.post_id !== postId);
  if (db.bookmarks) {
    db.bookmarks = db.bookmarks.filter((b) => b.target_id !== postId);
  }

  await saveDB(db);
  return { success: true };
}

export async function toggleLocalLike(
  postId: string,
  userId: string,
  actorMeta?: { username?: string; full_name?: string; avatar_url?: string }
): Promise<{ liked: boolean; count: number }> {
  const db = await ensureDB();
  const effectiveUserId = userId || "default-user";
  const actorUsername = actorMeta?.username || "developer";

  const existingIdx = db.likes.findIndex(
    (l) => l.post_id === postId && (l.user_id === effectiveUserId || (l.user_username && l.user_username.toLowerCase() === actorUsername.toLowerCase()))
  );
  const post = db.posts.find((p) => p.id === postId);

  let liked = false;
  if (existingIdx >= 0) {
    db.likes.splice(existingIdx, 1);
    liked = false;
    if (post) {
      post.likes_count = Math.max(0, (post.likes_count || 1) - 1);
    }
  } else {
    db.likes.push({
      post_id: postId,
      user_id: effectiveUserId,
      user_username: actorUsername,
      created_at: new Date().toISOString(),
    });
    liked = true;
    if (post) {
      post.likes_count = (post.likes_count || 0) + 1;

      // Create notification for post author if not liking own post
      const isOwnPost =
        post.author_id === effectiveUserId ||
        (post.author?.username && post.author.username.toLowerCase() === actorUsername.toLowerCase());

      if (!isOwnPost) {
        const actorProfile = db.profiles.find((p) => p.id === effectiveUserId || p.username.toLowerCase() === actorUsername.toLowerCase());
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: randomUUID(),
          recipient_id: post.author_id,
          recipient_username: post.author?.username,
          actor_id: effectiveUserId,
          actor: {
            username: actorProfile?.username || actorUsername,
            full_name: actorProfile?.full_name || actorMeta?.full_name || "CodeSphere Developer",
            avatar_url: actorProfile?.avatar_url || actorMeta?.avatar_url || "",
          },
          notification_type: "like",
          reference_id: postId,
          post_title: post.title || post.content.slice(0, 35),
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  const count = post ? (typeof post.likes_count === "number" ? post.likes_count : 0) : 0;
  await saveDB(db);
  return { liked, count };
}

export async function getLocalComments(postId: string): Promise<StoredComment[]> {
  const db = await ensureDB();
  const comments = db.comments.filter((c) => c.post_id === postId);

  // Enrich with latest avatar and profile info
  return comments
    .map((c) => {
      const authorProfile = db.profiles.find(
        (p) => p.id === c.author_id || (c.author?.username && p.username.toLowerCase() === c.author.username.toLowerCase())
      );
      return {
        ...c,
        author: {
          ...c.author,
          username: authorProfile?.username || c.author.username,
          full_name: authorProfile?.full_name || c.author.full_name,
          avatar_url: authorProfile?.avatar_url !== undefined ? authorProfile.avatar_url : (c.author.avatar_url || ""),
          is_verified: isUserVerified(authorProfile?.username || c.author.username, db.verified_usernames) || authorProfile?.is_verified === true,
        },
      };
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function addLocalComment(
  postId: string,
  authorId: string,
  author: { username: string; full_name: string; avatar_url: string },
  content: string
): Promise<StoredComment> {
  const db = await ensureDB();
  const authorProfile = db.profiles.find((p) => p.id === authorId || p.username.toLowerCase() === author.username.toLowerCase());

  const newComment: StoredComment = {
    id: randomUUID(),
    post_id: postId,
    author_id: authorId,
    author: {
      id: authorId,
      username: authorProfile?.username || author.username,
      full_name: authorProfile?.full_name || author.full_name,
      avatar_url: authorProfile?.avatar_url !== undefined ? authorProfile.avatar_url : (author.avatar_url || ""),
    },
    content,
    created_at: new Date().toISOString(),
  };

  db.comments.push(newComment);
  const post = db.posts.find((p) => p.id === postId);
  if (post) {
    post.comments_count = db.comments.filter((c) => c.post_id === postId).length;

    // Create notification for post author if not commenting on own post
    const isOwnPost =
      post.author_id === authorId ||
      (post.author?.username && post.author.username.toLowerCase() === author.username.toLowerCase());

    if (!isOwnPost) {
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: randomUUID(),
        recipient_id: post.author_id,
        recipient_username: post.author?.username,
        actor_id: authorId,
        actor: newComment.author,
        notification_type: "comment",
        reference_id: postId,
        post_title: post.title || post.content.slice(0, 35),
        comment_text: content.slice(0, 60),
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  await saveDB(db);
  return newComment;
}

export async function deleteLocalComment(
  commentId: string,
  userId?: string,
  currentUsername?: string
): Promise<{ success: boolean; error?: string }> {
  const db = await ensureDB();
  const idx = db.comments.findIndex((c) => c.id === commentId);
  if (idx === -1) return { success: false, error: "Comment not found" };

  const comment = db.comments[idx];
  const isMatch =
    (userId && (comment.author_id === userId || comment.author?.id === userId)) ||
    (currentUsername && comment.author?.username && comment.author.username.toLowerCase() === currentUsername.toLowerCase());

  if (!isMatch) {
    return { success: false, error: "Unauthorized: only the author can delete this comment" };
  }

  const postId = comment.post_id;
  db.comments.splice(idx, 1);

  const post = db.posts.find((p) => p.id === postId);
  if (post) {
    post.comments_count = db.comments.filter((c) => c.post_id === postId).length;
  }

  await saveDB(db);
  return { success: true };
}

/**
 * Unified follow/unfollow toggle with strict self-follow protection and persistent syncing
 */
export async function toggleLocalFollow(
  follower: { id: string; username: string; full_name?: string; avatar_url?: string },
  target: { id: string; username: string; full_name?: string; avatar_url?: string }
): Promise<{ following: boolean; error?: string }> {
  const db = await ensureDB();

  // STRICT SELF-FOLLOW BLOCK
  const isSelf =
    follower.id === target.id ||
    (follower.username && target.username && follower.username.toLowerCase() === target.username.toLowerCase()) ||
    target.username.toLowerCase() === "me";

  if (isSelf) {
    return { following: false, error: "You cannot follow yourself" };
  }

  // Resolve target's real ID and username from profiles if possible
  const targetProfile = db.profiles.find(
    (p) => p.id === target.id || p.username.toLowerCase() === target.username.toLowerCase()
  );
  const resolvedTargetId = targetProfile?.id || target.id;
  const resolvedTargetUsername = targetProfile?.username || target.username;

  // Resolve follower's real profile
  const followerProfile = db.profiles.find(
    (p) => p.id === follower.id || (follower.username && p.username.toLowerCase() === follower.username.toLowerCase())
  );
  const resolvedFollowerId = followerProfile?.id || follower.id;
  const resolvedFollowerUsername = followerProfile?.username || follower.username;

  const followerObj = { id: resolvedFollowerId, username: resolvedFollowerUsername };
  const targetObj = { id: resolvedTargetId, username: resolvedTargetUsername };

  // Check if existing follow record exists
  const existingIdx = db.follows.findIndex((f) => matchesFollow(f, followerObj, targetObj));

  let following = false;
  if (existingIdx >= 0) {
    // Unfollow: remove all matching records to avoid duplicates
    db.follows = db.follows.filter((f) => !matchesFollow(f, followerObj, targetObj));
    following = false;
  } else {
    // Follow
    db.follows.push({
      follower_id: resolvedFollowerId,
      follower_username: resolvedFollowerUsername,
      following_id: resolvedTargetId,
      following_username: resolvedTargetUsername,
      created_at: new Date().toISOString(),
    });
    following = true;

    // Trigger notification for the user being followed
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: randomUUID(),
      recipient_id: resolvedTargetId,
      recipient_username: resolvedTargetUsername,
      actor_id: resolvedFollowerId,
      actor: {
        username: followerProfile?.username || follower.username,
        full_name: followerProfile?.full_name || follower.full_name || "CodeSphere Developer",
        avatar_url: followerProfile?.avatar_url || follower.avatar_url || "",
      },
      notification_type: "follow",
      reference_id: resolvedFollowerUsername,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  }

  await saveDB(db);
  return { following };
}

export async function isLocalFollowing(
  follower: { id?: string; username?: string },
  following: { id?: string; username?: string }
): Promise<boolean> {
  const db = await ensureDB();
  return db.follows.some((f) => matchesFollow(f, follower, following));
}

export interface EnrichedBookmark extends StoredBookmark {
  post?: StoredPost | null;
  program?: {
    id: string;
    title: string;
    description?: string;
    source_code?: string;
    category?: string;
    updated_at?: string;
  } | null;
}

export async function getLocalBookmarks(userId: string): Promise<EnrichedBookmark[]> {
  const db = await ensureDB();
  const rawBookmarks = (db.bookmarks || []).filter(
    (b) => (userId ? b.user_id === userId : b.user_id === "default-user")
  );

  let workspacePrograms: any[] = [];
  try {
    const { getLocalPrograms } = await import("./workspaceStore");
    workspacePrograms = await getLocalPrograms(userId);
  } catch {}

  return rawBookmarks.map((b) => {
    let post = null;
    let program = null;

    if (b.target_type === "post") {
      const foundPost = db.posts.find((p) => p.id === b.target_id);
      if (foundPost) {
        const authorProf = db.profiles.find(
          (prof) => prof.id === foundPost.author_id || (foundPost.author?.username && prof.username.toLowerCase() === foundPost.author.username.toLowerCase())
        );
        post = {
          ...foundPost,
          author: {
            ...foundPost.author,
            avatar_url: authorProf?.avatar_url || foundPost.author?.avatar_url || "",
          },
        };
      }
    } else if (b.target_type === "program") {
      const foundProg = workspacePrograms.find((p) => p.id === b.target_id);
      if (foundProg) {
        program = {
          id: foundProg.id,
          title: foundProg.title,
          description: foundProg.description,
          source_code: foundProg.source_code,
          category: foundProg.category,
          updated_at: foundProg.updated_at,
        };
      }
    }

    return {
      ...b,
      post,
      program,
    };
  });
}

export async function toggleLocalBookmark(
  userId: string,
  targetType: "post" | "program" | "collection",
  targetId: string
): Promise<{ bookmarked: boolean }> {
  const db = await ensureDB();
  if (!db.bookmarks) db.bookmarks = [];

  const effectiveUserId = userId || "default-user";
  const existingIdx = db.bookmarks.findIndex(
    (b) => (userId ? b.user_id === userId : b.user_id === "default-user") && b.target_id === targetId
  );

  let bookmarked = false;
  if (existingIdx >= 0) {
    db.bookmarks.splice(existingIdx, 1);
    bookmarked = false;
  } else {
    db.bookmarks.push({
      id: randomUUID(),
      user_id: effectiveUserId,
      target_type: targetType,
      target_id: targetId,
      created_at: new Date().toISOString(),
    });
    bookmarked = true;
  }

  await saveDB(db);
  return { bookmarked };
}

export async function getRealTrendingTags(): Promise<{ tag: string; count: number }[]> {
  const db = await ensureDB();
  const counts = new Map<string, number>();

  for (const post of db.posts) {
    if (Array.isArray(post.tags)) {
      for (const t of post.tags) {
        const clean = t.trim().toLowerCase().replace(/^#/, "");
        if (clean) {
          counts.set(clean, (counts.get(clean) || 0) + 1);
        }
      }
    }
  }

  const sorted = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return sorted;
}

export async function saveLocalProfile(profileData: Partial<StoredProfile> & { id: string }): Promise<StoredProfile> {
  const db = await ensureDB();
  if (!db.profiles) db.profiles = [];

  const existingIdx = db.profiles.findIndex(
    (p) => p.id === profileData.id || (profileData.username && p.username.toLowerCase() === profileData.username.toLowerCase())
  );
  const now = new Date().toISOString();
  let updatedProfile: StoredProfile;

  if (existingIdx >= 0) {
    updatedProfile = {
      ...db.profiles[existingIdx],
      ...profileData,
      updated_at: now,
    };
    db.profiles[existingIdx] = updatedProfile;
  } else {
    updatedProfile = {
      id: profileData.id,
      username: profileData.username || "developer",
      full_name: profileData.full_name || "Developer",
      avatar_url: profileData.avatar_url || "",
      bio: profileData.bio || "",
      college: profileData.college || "",
      skills: profileData.skills || [],
      created_at: now,
      updated_at: now,
    };
    db.profiles.push(updatedProfile);
  }

  // Propagate PFP and name across user's existing posts and comments so others see it immediately!
  for (const post of db.posts) {
    if (post.author_id === updatedProfile.id || post.author?.username.toLowerCase() === updatedProfile.username.toLowerCase()) {
      post.author.username = updatedProfile.username;
      post.author.full_name = updatedProfile.full_name;
      if (updatedProfile.avatar_url !== undefined) {
        post.author.avatar_url = updatedProfile.avatar_url;
      }
    }
  }

  for (const c of db.comments) {
    if (c.author_id === updatedProfile.id || c.author?.username.toLowerCase() === updatedProfile.username.toLowerCase()) {
      c.author.username = updatedProfile.username;
      c.author.full_name = updatedProfile.full_name;
      if (updatedProfile.avatar_url !== undefined) {
        c.author.avatar_url = updatedProfile.avatar_url;
      }
    }
  }

  // Also update notifications where this user was the actor
  for (const n of db.notifications) {
    if (n.actor_id === updatedProfile.id || n.actor?.username?.toLowerCase() === updatedProfile.username.toLowerCase()) {
      n.actor.username = updatedProfile.username;
      n.actor.full_name = updatedProfile.full_name;
      if (updatedProfile.avatar_url !== undefined) {
        n.actor.avatar_url = updatedProfile.avatar_url;
      }
    }
  }

  await saveDB(db);
  return updatedProfile;
}

export async function getLocalProfileData(
  targetUsername: string,
  currentUserId?: string,
  currentUserMeta?: { username?: string; full_name?: string; avatar_url?: string }
) {
  const db = await ensureDB();
  const searchUsername = targetUsername.toLowerCase().trim();
  const currentUsername = currentUserMeta?.username?.toLowerCase()?.trim();
  const effectiveUserId = currentUserId || "default-user";

  const isMe =
    targetUsername === "me" ||
    (currentUsername && currentUsername === searchUsername) ||
    (currentUserId && currentUserId === targetUsername);

  // Check stored profiles first
  let profile: StoredProfile | undefined = db.profiles.find(
    (p) =>
      (isMe && (p.id === effectiveUserId || (currentUsername && p.username.toLowerCase() === currentUsername))) ||
      p.username.toLowerCase() === searchUsername ||
      p.id === targetUsername ||
      (searchUsername === "codesphere" && p.id === TEAM_PROFILE.id) ||
      (searchUsername === "team" && p.id === TEAM_PROFILE.id)
  );

  if (!profile) {
    if (isMe) {
      profile = {
        id: effectiveUserId,
        username: currentUserMeta?.username || "developer",
        full_name: currentUserMeta?.full_name || "CodeSphere Developer",
        avatar_url: currentUserMeta?.avatar_url || "",
        bio: "",
        college: "",
        skills: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // Save it so future searches find it, deduping by ID or username
      const existingIdx = db.profiles.findIndex(
        (p) => p.id === profile?.id || (profile?.username && p.username.toLowerCase() === profile.username.toLowerCase())
      );
      if (existingIdx >= 0) {
        db.profiles[existingIdx] = { ...db.profiles[existingIdx], ...profile };
      } else {
        db.profiles.push(profile);
      }
      await saveDB(db);
    } else {
      // Search posts for this author
      const postWithAuthor = db.posts.find(
        (p) => p.author?.username?.toLowerCase() === searchUsername || p.author_id === targetUsername
      );

      if (postWithAuthor?.author) {
        profile = {
          id: postWithAuthor.author_id,
          username: postWithAuthor.author.username,
          full_name: postWithAuthor.author.full_name || postWithAuthor.author.username,
          avatar_url: postWithAuthor.author.avatar_url || "",
          bio: "",
          college: "",
          skills: [],
          created_at: postWithAuthor.created_at,
          updated_at: postWithAuthor.created_at,
        };
      } else {
        profile = {
          id: `user-${targetUsername}`,
          username: targetUsername,
          full_name: targetUsername.charAt(0).toUpperCase() + targetUsername.slice(1),
          avatar_url: "",
          bio: "",
          college: "",
          skills: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  const targetId = profile.id;
  const isOwner = Boolean(
    isMe ||
    (currentUserId && currentUserId === targetId) ||
    (currentUsername && currentUsername === profile.username.toLowerCase())
  );

  const currentUserObj = { id: effectiveUserId, username: currentUserMeta?.username };
  const targetUserObj = { id: targetId, username: profile.username };

  // Followers & Following counts
  const followersCount = db.follows.filter((f) =>
    matchesFollow(f, { id: f.follower_id, username: f.follower_username }, targetUserObj)
  ).length;

  const followingCount = db.follows.filter((f) =>
    matchesFollow(f, targetUserObj, { id: f.following_id, username: f.following_username })
  ).length;

  // Does current user follow this target?
  const isFollowing = !isOwner && db.follows.some((f) => matchesFollow(f, currentUserObj, targetUserObj));

  // Does this target follow current user back?
  const isFollowedBy = !isOwner && db.follows.some((f) => matchesFollow(f, targetUserObj, currentUserObj));

  // Posts by this user
  const userPosts = db.posts
    .filter(
      (p) =>
        p.author_id === targetId ||
        p.author?.username?.toLowerCase() === profile.username.toLowerCase()
    )
    .map((p) => {
      const isLiked = db.likes.some(
        (l) => (l.user_id === effectiveUserId || (currentUsername && l.user_username === currentUsername)) && l.post_id === p.id
      );
      const isBookmarked = (db.bookmarks || []).some(
        (b) => (b.user_id === effectiveUserId || (currentUserId && b.user_id === currentUserId)) && b.target_id === p.id
      );
      return {
        ...p,
        author: {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url || "",
        },
        is_liked: isLiked,
        is_bookmarked: isBookmarked,
        is_following: isFollowing,
        likes_count: typeof p.likes_count === "number" ? p.likes_count : 0,
        comments_count: db.comments.filter((c) => c.post_id === p.id).length,
      };
    });

  // Fetch public C programs for this profile
  let userPrograms: any[] = [];
  try {
    const allPrograms = await getLocalPrograms();
    userPrograms = allPrograms.filter((p) => {
      const belongsToProfile =
        p.owner_id === targetId ||
        p.owner_id === profile.id ||
        (targetId === "default-user" && (!p.owner_id || p.owner_id === "default-user")) ||
        (profile.username.toLowerCase() === "developer" && p.owner_id === "default-user") ||
        (isOwner && (p.owner_id === effectiveUserId || p.owner_id === "default-user" || p.owner_id === targetId));

      // As requested: When a user publics a program from his personal codespace, it appears at his profile (and others can see it)
      return belongsToProfile && p.visibility === "public";
    });
  } catch (err) {
    console.error("Error fetching local programs for profile:", err);
  }

  // Fetch collections by this user
  const deletedCollectionIds = new Set(db.deleted_collection_ids || []);
  const userCollections = (Array.isArray(db.collections) ? db.collections : SEED_COLLECTIONS)
    .filter((c) => !deletedCollectionIds.has(c.id))
    .filter((c) => {
      const belongs =
        c.owner_id === targetId ||
        c.owner_id === profile.id ||
        c.owner?.username?.toLowerCase() === profile.username.toLowerCase();
      return belongs && (isOwner ? true : c.visibility === "public");
    })
    .map((col) => ({
      ...col,
      collection_programs: [{ count: (col.programs || []).length }],
    }));

  const finalProfile = {
    ...profile,
    is_verified: isUserVerified(profile.username, db.verified_usernames) || profile.is_verified === true,
  };

  return {
    profile: finalProfile,
    isOwner,
    isFollowing,
    isFollowedBy,
    stats: {
      followersCount,
      followingCount,
      programsCount: userPrograms.length,
      postsCount: userPosts.length,
    },
    programs: userPrograms,
    posts: userPosts,
    collections: userCollections,
  };
}

/**
 * Returns followers and following list for a given user profile
 */
export async function getLocalRelationships(
  targetUsernameOrId: string,
  currentUserId?: string,
  currentUsername?: string
): Promise<{
  followers: NetworkUser[];
  following: NetworkUser[];
}> {
  const db = await ensureDB();
  const search = targetUsernameOrId.toLowerCase().trim();

  // Find target profile
  const targetProfile = db.profiles.find(
    (p) =>
      p.username.toLowerCase() === search ||
      p.id === targetUsernameOrId ||
      (search === "codesphere" && p.id === TEAM_PROFILE.id)
  ) || {
    id: `user-${search}`,
    username: search,
    full_name: search.charAt(0).toUpperCase() + search.slice(1),
    avatar_url: "",
  };

  const targetObj = { id: targetProfile.id, username: targetProfile.username };
  const currentObj = { id: currentUserId || "default-user", username: currentUsername };

  // 1. Followers: people who follow target
  const followerRecords = db.follows.filter((f) =>
    matchesFollow(f, { id: f.follower_id, username: f.follower_username }, targetObj)
  );

  const followers: NetworkUser[] = [];
  const seenFollowerIds = new Set<string>();

  for (const f of followerRecords) {
    const fId = f.follower_id;
    const fUsername = f.follower_username || fId.replace(/^user-/, "");
    if (seenFollowerIds.has(fUsername.toLowerCase())) continue;
    seenFollowerIds.add(fUsername.toLowerCase());

    const prof = db.profiles.find(
      (p) => p.id === fId || p.username.toLowerCase() === fUsername.toLowerCase()
    );

    const userObj = { id: prof?.id || fId, username: prof?.username || fUsername };
    const isSelf = Boolean(
      (currentUserId && currentUserId === userObj.id) ||
      (currentUsername && currentUsername.toLowerCase() === userObj.username.toLowerCase())
    );
    const isFollowing = !isSelf && db.follows.some((rec) => matchesFollow(rec, currentObj, userObj));
    const isFollowedBy = !isSelf && db.follows.some((rec) => matchesFollow(rec, userObj, currentObj));

    followers.push({
      id: prof?.id || fId,
      username: prof?.username || fUsername,
      full_name: prof?.full_name || fUsername.charAt(0).toUpperCase() + fUsername.slice(1),
      avatar_url: prof?.avatar_url || "",
      bio: prof?.bio || "",
      is_following: isFollowing,
      is_followed_by: isFollowedBy,
      is_self: isSelf,
      is_verified: isUserVerified(prof?.username || fUsername, db.verified_usernames) || prof?.is_verified === true,
    });
  }

  // 2. Following: people whom target follows
  const followingRecords = db.follows.filter((f) =>
    matchesFollow(f, targetObj, { id: f.following_id, username: f.following_username })
  );

  const following: NetworkUser[] = [];
  const seenFollowingIds = new Set<string>();

  for (const f of followingRecords) {
    const fId = f.following_id;
    const fUsername = f.following_username || fId.replace(/^user-/, "");
    if (seenFollowingIds.has(fUsername.toLowerCase())) continue;
    seenFollowingIds.add(fUsername.toLowerCase());

    const prof = db.profiles.find(
      (p) => p.id === fId || p.username.toLowerCase() === fUsername.toLowerCase()
    );

    const userObj = { id: prof?.id || fId, username: prof?.username || fUsername };
    const isSelf = Boolean(
      (currentUserId && currentUserId === userObj.id) ||
      (currentUsername && currentUsername.toLowerCase() === userObj.username.toLowerCase())
    );
    const isFollowing = !isSelf && db.follows.some((rec) => matchesFollow(rec, currentObj, userObj));
    const isFollowedBy = !isSelf && db.follows.some((rec) => matchesFollow(rec, userObj, currentObj));

    following.push({
      id: prof?.id || fId,
      username: prof?.username || fUsername,
      full_name: prof?.full_name || fUsername.charAt(0).toUpperCase() + fUsername.slice(1),
      avatar_url: prof?.avatar_url || "",
      bio: prof?.bio || "",
      is_following: isFollowing,
      is_followed_by: isFollowedBy,
      is_self: isSelf,
      is_verified: isUserVerified(prof?.username || fUsername, db.verified_usernames) || prof?.is_verified === true,
    });
  }

  return { followers, following };
}

// Notification Helpers
export async function addLocalNotification(
  notif: Omit<StoredNotification, "id" | "created_at">
): Promise<StoredNotification> {
  const db = await ensureDB();
  if (!db.notifications) db.notifications = [];

  const newNotif: StoredNotification = {
    ...notif,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };

  db.notifications.unshift(newNotif);
  if (db.notifications.length > 100) {
    db.notifications.length = 100;
  }

  await saveDB(db);
  return newNotif;
}

export async function getLocalNotifications(
  userId?: string,
  username?: string
): Promise<StoredNotification[]> {
  const db = await ensureDB();
  if (!db.notifications) return [];
  if (!userId && !username) return [];

  const cleanUser = username?.toLowerCase();

  const userNotifications = db.notifications.filter((n) => {
    if (userId && n.recipient_id === userId) return true;
    if (cleanUser && (
      (n.recipient_username && n.recipient_username.toLowerCase() === cleanUser) ||
      n.recipient_id.toLowerCase() === cleanUser ||
      n.recipient_id.toLowerCase() === `user-${cleanUser}`
    )) return true;
    return false;
  });

  // Enrich actor with latest profile details (such as updated PFP)
  return userNotifications.map((n) => {
    const actorProf = db.profiles.find(
      (p) => p.id === n.actor_id || (n.actor?.username && p.username.toLowerCase() === n.actor.username.toLowerCase())
    );
    return {
      ...n,
      actor: {
        username: actorProf?.username || n.actor?.username || "developer",
        full_name: actorProf?.full_name || n.actor?.full_name || "CodeSphere Developer",
        avatar_url: actorProf?.avatar_url !== undefined ? actorProf.avatar_url : (n.actor?.avatar_url || ""),
      },
    };
  });
}

export async function markAllLocalNotificationsRead(userId?: string, username?: string): Promise<boolean> {
  const db = await ensureDB();
  if (!db.notifications) return true;
  if (!userId && !username) return true;

  const cleanUser = username?.toLowerCase();

  for (const n of db.notifications) {
    const isTarget =
      (userId && n.recipient_id === userId) ||
      (cleanUser && (
        (n.recipient_username && n.recipient_username.toLowerCase() === cleanUser) ||
        n.recipient_id.toLowerCase() === cleanUser ||
        n.recipient_id.toLowerCase() === `user-${cleanUser}`
      ));

    if (isTarget) {
      n.is_read = true;
    }
  }

  await saveDB(db);
  return true;
}

export async function deleteLocalNotification(
  notificationId: string,
  userId?: string,
  username?: string
): Promise<boolean> {
  const db = await ensureDB();
  if (!db.notifications) return true;

  const cleanUser = username?.toLowerCase();
  const idx = db.notifications.findIndex((n) => {
    if (n.id !== notificationId) return false;
    if (!userId && !username) return true;
    return (
      (userId && n.recipient_id === userId) ||
      (cleanUser && (
        (n.recipient_username && n.recipient_username.toLowerCase() === cleanUser) ||
        n.recipient_id.toLowerCase() === cleanUser ||
        n.recipient_id.toLowerCase() === `user-${cleanUser}`
      ))
    );
  });

  if (idx >= 0) {
    db.notifications.splice(idx, 1);
    await saveDB(db);
    return true;
  }
  return false;
}

export async function clearLocalNotifications(
  userId?: string,
  username?: string
): Promise<boolean> {
  const db = await ensureDB();
  if (!db.notifications) return true;
  if (!userId && !username) return true;

  const cleanUser = username?.toLowerCase();

  db.notifications = db.notifications.filter((n) => {
    const isTarget =
      (userId && n.recipient_id === userId) ||
      (cleanUser && (
        (n.recipient_username && n.recipient_username.toLowerCase() === cleanUser) ||
        n.recipient_id.toLowerCase() === cleanUser ||
        n.recipient_id.toLowerCase() === `user-${cleanUser}`
      ));

    return !isTarget;
  });

  await saveDB(db);
  return true;
}

export async function removeLocalFollower(
  owner: { id: string; username: string },
  followerToRemove: { id: string; username: string }
): Promise<{ success: boolean; followersCount: number }> {
  const db = await ensureDB();

  // In db.follows, follower is `followerToRemove`, and following is `owner`
  const beforeCount = db.follows.length;
  db.follows = db.follows.filter((f) => !matchesFollow(f, followerToRemove, owner));

  // Compute updated followers count for owner
  const followersCount = db.follows.filter((f) =>
    matchesFollow(f, { id: f.follower_id, username: f.follower_username }, owner)
  ).length;

  await saveDB(db);
  return { success: db.follows.length < beforeCount, followersCount };
}

/**
 * =========================================================
 * Collections (Public & Private Folders) Store Helpers
 * =========================================================
 */

export async function getLocalCollections(tag?: string): Promise<any[]> {
  const db = await ensureDB();
  const deletedIds = new Set(db.deleted_collection_ids || []);
  let collections = (Array.isArray(db.collections) ? db.collections : SEED_COLLECTIONS).filter(
    (c) => !deletedIds.has(c.id)
  );

  // Filter for public visibility
  collections = collections.filter((c) => c.visibility === "public");

  if (tag) {
    collections = collections.filter((c) => c.tags?.includes(tag.toLowerCase()));
  }

  // Format into shape compatible with frontend (including collection_programs)
  return collections.map((col) => {
    const ownerUsername = col.owner?.username || "";
    const ownerProfile = db.profiles.find(
      (p) => p.username.toLowerCase() === ownerUsername.toLowerCase() || p.id === col.owner_id
    );
    const isVerified =
      isUserVerified(ownerUsername, db.verified_usernames) || ownerProfile?.is_verified === true;

    return {
      ...col,
      owner: {
        ...col.owner,
        is_verified: isVerified,
      },
      collection_programs: (col.programs || []).map((p, idx) => ({
        position: idx,
        program: p,
      })),
    };
  });
}

export async function getLocalCollectionById(id: string): Promise<StoredCollection | null> {
  const db = await ensureDB();
  const deletedIds = new Set(db.deleted_collection_ids || []);
  if (deletedIds.has(id)) return null;

  const collections = (Array.isArray(db.collections) ? db.collections : SEED_COLLECTIONS).filter(
    (c) => !deletedIds.has(c.id)
  );
  const found = collections.find((c) => c.id === id);
  if (!found) return null;
  const ownerUsername = found.owner?.username || "";
  const ownerProfile = db.profiles.find(
    (p) => p.username.toLowerCase() === ownerUsername.toLowerCase() || p.id === found.owner_id
  );
  const isVerified =
    isUserVerified(ownerUsername, db.verified_usernames) || ownerProfile?.is_verified === true;
  return {
    ...found,
    owner: {
      ...found.owner,
      is_verified: isVerified,
    },
  };
}

export async function saveLocalCollection(data: {
  owner_id: string;
  owner?: { id?: string; username: string; full_name: string; avatar_url: string };
  title: string;
  description?: string;
  tags?: string[];
  visibility?: "public" | "private";
  programs?: StoredCollectionProgram[];
}): Promise<StoredCollection> {
  const db = await ensureDB();
  if (!db.collections) db.collections = [...SEED_COLLECTIONS];

  const newCollection: StoredCollection = {
    id: `col-${randomUUID()}`,
    owner_id: data.owner_id,
    owner: data.owner || {
      id: data.owner_id,
      username: "developer",
      full_name: "CodeSphere Developer",
      avatar_url: "",
    },
    title: data.title,
    description: data.description || "",
    tags: data.tags || [],
    visibility: data.visibility || "public",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    programs: data.programs || [],
  };

  db.collections.unshift(newCollection);
  await saveDB(db);
  return newCollection;
}

export async function deleteLocalCollection(
  id: string,
  userId?: string,
  username?: string
): Promise<boolean> {
  const db = await ensureDB();
  if (!db.collections) db.collections = [];
  if (!db.deleted_collection_ids) db.deleted_collection_ids = [];

  const cleanUser = username?.toLowerCase();
  const isTeam = cleanUser === "codesphere" || cleanUser === "team";

  const initialLength = db.collections.length;
  db.collections = db.collections.filter((c) => {
    if (c.id !== id) return true;
    const ownerMatches =
      !userId ||
      c.owner_id === userId ||
      c.owner_id === "default-user" ||
      c.owner_id === "7bef2dac-45a9-4b55-b15b-f6df28bdc9f1" ||
      (cleanUser && c.owner?.username && c.owner.username.toLowerCase() === cleanUser) ||
      isTeam;

    if (!ownerMatches) return true;
    return false;
  });

  const removed = db.collections.length < initialLength;
  if (!db.deleted_collection_ids.includes(id)) {
    db.deleted_collection_ids.push(id);
  }
  await saveDB(db);
  return removed || true;
}
