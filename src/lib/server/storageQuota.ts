import { createAdminClient } from "@/lib/supabase/admin";
import { getLocalPrograms } from "@/lib/storage/workspaceStore";

export const TOTAL_STORAGE_LIMIT = 30 * 1024 * 1024; // 30 MB (31,457,280 bytes)
export const CODE_STORAGE_LIMIT = 10 * 1024 * 1024; // 10 MB (10,485,760 bytes)
export const AVATAR_STORAGE_LIMIT = 2 * 1024 * 1024; // 2 MB (2,097,152 bytes)
export const MEDIA_STORAGE_LIMIT = 18 * 1024 * 1024; // 18 MB (18,874,368 bytes)

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface StorageQuotaUsage {
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

  isWarning: boolean; // >= 80%
  isExhausted: boolean; // >= 100%
}

// In-memory cache with short TTL (5 seconds) to avoid repeated storage scan during burst interactions
const storageCache = new Map<string, { data: StorageQuotaUsage; expiresAt: number }>();

export function invalidateStorageCache(userId: string) {
  storageCache.delete(userId);
}

/**
 * Calculates accurate storage usage for a given user across programs, versions, and Supabase Storage.
 */
export async function getUserStorageUsage(userId: string): Promise<StorageQuotaUsage> {
  const cached = storageCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const admin = createAdminClient();

  let programsBytes = 0;
  let versionsBytes = 0;
  let programsCount = 0;
  let versionsCount = 0;

  let avatarBytes = 0;
  let postMediaBytes = 0;
  let mediaFilesCount = 0;

  try {
    // 1. Fetch Code Storage: Programs & Versions
    const [programsRes, versionsRes, profileRes] = await Promise.all([
      admin.from("programs").select("id, source_code").eq("owner_id", userId),
      admin.from("program_versions").select("id, source_code").eq("owner_id", userId),
      admin.from("profiles").select("avatar_url").eq("id", userId).maybeSingle(),
    ]);

    let programs = programsRes.data || [];
    if (programs.length === 0) {
      // Fallback to local store if Supabase returned 0
      const local = await getLocalPrograms(userId);
      programs = local.filter((p) => p.owner_id === userId);
    }

    programsCount = programs.length;
    for (const prog of programs) {
      programsBytes += Buffer.byteLength(prog.source_code || "", "utf8");
    }

    const versions = versionsRes.data || [];
    versionsCount = versions.length;
    for (const ver of versions) {
      versionsBytes += Buffer.byteLength(ver.source_code || "", "utf8");
    }

    // 2. Fetch Media Storage from Supabase Storage buckets
    const [avatarsListRes, mediaListRes] = await Promise.all([
      admin.storage.from("avatars").list(userId).catch(() => ({ data: [], error: null })),
      admin.storage.from("media").list(userId).catch(() => ({ data: [], error: null })),
    ]);

    const avatarFiles = avatarsListRes.data || [];
    for (const file of avatarFiles) {
      const size = Number(file.metadata?.size || file.metadata?.contentLength || 0);
      avatarBytes += size;
      mediaFilesCount++;
    }

    const mediaFiles = mediaListRes.data || [];
    for (const file of mediaFiles) {
      const size = Number(file.metadata?.size || file.metadata?.contentLength || 0);
      postMediaBytes += size;
      mediaFilesCount++;
    }

    // Account for legacy raw base64 data URLs in profile avatar_url if any
    const rawAvatar = profileRes.data?.avatar_url;
    if (rawAvatar && rawAvatar.startsWith("data:") && avatarBytes === 0) {
      // Approximate decoded binary size of base64
      avatarBytes += Math.round((rawAvatar.length * 3) / 4);
    }
  } catch (err) {
    console.warn("Storage quota calculation warning:", err);
  }

  const codeBytes = programsBytes + versionsBytes;
  const mediaBytes = avatarBytes + postMediaBytes;
  const totalBytes = codeBytes + mediaBytes;

  const remainingTotalBytes = Math.max(0, TOTAL_STORAGE_LIMIT - totalBytes);
  const remainingCodeBytes = Math.max(0, CODE_STORAGE_LIMIT - codeBytes);
  const remainingAvatarBytes = Math.max(0, AVATAR_STORAGE_LIMIT - avatarBytes);
  const remainingMediaBytes = Math.max(0, MEDIA_STORAGE_LIMIT - postMediaBytes);

  const totalPercent = Math.min(100, Math.round((totalBytes / TOTAL_STORAGE_LIMIT) * 1000) / 10);
  const codePercent = Math.min(100, Math.round((codeBytes / CODE_STORAGE_LIMIT) * 1000) / 10);
  const mediaPercent = Math.min(100, Math.round((mediaBytes / (AVATAR_STORAGE_LIMIT + MEDIA_STORAGE_LIMIT)) * 1000) / 10);

  const isWarning = totalPercent >= 80;
  const isExhausted = totalBytes >= TOTAL_STORAGE_LIMIT;

  const usage: StorageQuotaUsage = {
    userId,
    codeBytes,
    programsBytes,
    versionsBytes,
    programsCount,
    versionsCount,

    mediaBytes,
    avatarBytes,
    postMediaBytes,
    mediaFilesCount,

    totalBytes,
    totalLimitBytes: TOTAL_STORAGE_LIMIT,
    codeLimitBytes: CODE_STORAGE_LIMIT,
    avatarLimitBytes: AVATAR_STORAGE_LIMIT,
    mediaLimitBytes: MEDIA_STORAGE_LIMIT,

    remainingTotalBytes,
    remainingCodeBytes,
    remainingAvatarBytes,
    remainingMediaBytes,

    totalPercent,
    codePercent,
    mediaPercent,

    isWarning,
    isExhausted,
  };

  storageCache.set(userId, { data: usage, expiresAt: Date.now() + 5000 });
  return usage;
}

/**
 * Validates whether an incoming upload/code save fits within the user's quota.
 */
export async function checkStorageQuota(
  userId: string,
  incomingBytes: number,
  category: "code" | "avatar" | "post_media"
): Promise<{ allowed: boolean; reason?: string; usage: StorageQuotaUsage }> {
  const usage = await getUserStorageUsage(userId);

  // 1. Overall storage limit check (30 MB)
  if (usage.totalBytes + incomingBytes > TOTAL_STORAGE_LIMIT) {
    const overMb = ((usage.totalBytes + incomingBytes - TOTAL_STORAGE_LIMIT) / (1024 * 1024)).toFixed(2);
    return {
      allowed: false,
      reason: `Total storage quota exceeded (30 MB limit). This operation would exceed your limit by ${overMb} MB. Please delete unused programs or media.`,
      usage,
    };
  }

  // 2. Category-specific allocation checks
  if (category === "code" && usage.codeBytes + incomingBytes > CODE_STORAGE_LIMIT) {
    return {
      allowed: false,
      reason: `Code storage quota exceeded (10 MB limit). Delete older programs or version history in your workspace.`,
      usage,
    };
  }

  if (category === "avatar" && usage.avatarBytes + incomingBytes > AVATAR_STORAGE_LIMIT) {
    return {
      allowed: false,
      reason: `Profile photo quota exceeded (2 MB limit). Please select an optimized image.`,
      usage,
    };
  }

  if (category === "post_media" && usage.postMediaBytes + incomingBytes > MEDIA_STORAGE_LIMIT) {
    return {
      allowed: false,
      reason: `Post media quota exceeded (18 MB limit). Delete older post attachments to free up space.`,
      usage,
    };
  }

  return { allowed: true, usage };
}

/**
 * Uploads user media (avatar or post attachment) to Supabase Storage with automatic quota enforcement.
 */
export async function uploadUserMedia(
  userId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  fileType: "avatar" | "post_media"
): Promise<{
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  fileSize?: number;
  error?: string;
}> {
  // 1. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      success: false,
      error: "Unsupported file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
    };
  }

  const fileSize = buffer.length;

  // 2. Enforce category size limits
  if (fileType === "avatar" && fileSize > AVATAR_STORAGE_LIMIT) {
    return {
      success: false,
      error: `Profile avatar exceeds 2 MB limit (file is ${(fileSize / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  if (fileType === "post_media" && fileSize > MEDIA_STORAGE_LIMIT) {
    return {
      success: false,
      error: `Post attachment exceeds 18 MB limit (file is ${(fileSize / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  const bucketName = fileType === "avatar" ? "avatars" : "media";
  const admin = createAdminClient();

  // 3. Check quota before uploading
  // If uploading an avatar, previous avatar space will be replaced and freed
  let estimatedDelta = fileSize;
  if (fileType === "avatar") {
    try {
      const { data: existingFiles } = await admin.storage.from("avatars").list(userId);
      if (existingFiles && existingFiles.length > 0) {
        const oldSize = existingFiles.reduce(
          (acc, f) => acc + Number(f.metadata?.size || f.metadata?.contentLength || 0),
          0
        );
        estimatedDelta = Math.max(0, fileSize - oldSize);
      }
    } catch {}
  }

  const quotaCheck = await checkStorageQuota(userId, estimatedDelta, fileType);
  if (!quotaCheck.allowed) {
    return { success: false, error: quotaCheck.reason };
  }

  // 4. Generate clean storage path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const storagePath = `${userId}/${timestamp}-${sanitizedName}`;

  try {
    // 5. If avatar: Remove previous avatar files in bucket to prevent orphaned storage
    if (fileType === "avatar") {
      try {
        const { data: oldFiles } = await admin.storage.from("avatars").list(userId);
        if (oldFiles && oldFiles.length > 0) {
          const pathsToRemove = oldFiles.map((f) => `${userId}/${f.name}`);
          await admin.storage.from("avatars").remove(pathsToRemove);
        }
      } catch (cleanErr) {
        console.warn("Avatar cleanup warning:", cleanErr);
      }
    }

    // 6. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await admin.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError || !uploadData) {
      return { success: false, error: uploadError?.message || "Storage upload failed" };
    }

    // 7. Retrieve public URL
    const { data: urlData } = admin.storage.from(bucketName).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    // 8. Record in user_media_files table if table exists
    try {
      await admin.from("user_media_files").insert({
        user_id: userId,
        bucket_id: bucketName,
        storage_path: storagePath,
        file_name: sanitizedName,
        file_size: fileSize,
        mime_type: mimeType,
        file_type: fileType,
        public_url: publicUrl,
        is_orphaned: false,
      });
    } catch {}

    invalidateStorageCache(userId);

    return {
      success: true,
      publicUrl,
      storagePath,
      fileSize,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unexpected upload error",
    };
  }
}

/**
 * Removes a file from Supabase Storage and updates the user's storage quota immediately.
 */
export async function deleteUserMedia(userId: string, publicUrlOrPath: string): Promise<boolean> {
  const admin = createAdminClient();

  try {
    let bucket = "media";
    let objectPath = "";

    if (publicUrlOrPath.includes("/storage/v1/object/public/")) {
      const parts = publicUrlOrPath.split("/storage/v1/object/public/")[1];
      const [bucketPart, ...pathParts] = parts.split("/");
      bucket = bucketPart;
      objectPath = pathParts.join("/");
    } else {
      objectPath = publicUrlOrPath;
    }

    // Security check: ensure path belongs to userId
    if (!objectPath.startsWith(`${userId}/`)) {
      return false;
    }

    await admin.storage.from(bucket).remove([objectPath]);

    try {
      await admin.from("user_media_files").delete().eq("storage_path", objectPath);
    } catch {}

    invalidateStorageCache(userId);
    return true;
  } catch (err) {
    console.warn("deleteUserMedia error:", err);
    return false;
  }
}

/**
 * Scans for unreferenced/orphaned files in user's storage and permanently purges them.
 */
export async function cleanupOrphanedFiles(
  userId: string
): Promise<{ deletedCount: number; freedBytes: number }> {
  const admin = createAdminClient();
  let deletedCount = 0;
  let freedBytes = 0;

  try {
    // 1. Get user's current profile avatar and posts media_urls
    const [profileRes, postsRes, avatarsRes, mediaRes] = await Promise.all([
      admin.from("profiles").select("avatar_url").eq("id", userId).maybeSingle(),
      admin.from("posts").select("content").eq("author_id", userId),
      admin.storage.from("avatars").list(userId).catch(() => ({ data: [] })),
      admin.storage.from("media").list(userId).catch(() => ({ data: [] })),
    ]);

    const activeAvatar = profileRes.data?.avatar_url || "";
    const activeMediaUrls = new Set<string>();
    for (const p of postsRes.data || []) {
      const match = (p.content || "").match(/<!--media:(.+?)-->/);
      if (match && match[1]) {
        activeMediaUrls.add(match[1]);
      }
    }

    // 2. Check avatars bucket: any avatar file that is not the active avatar_url is orphaned
    const avatarFiles = avatarsRes.data || [];
    const orphanAvatarPaths: string[] = [];

    for (const f of avatarFiles) {
      const path = `${userId}/${f.name}`;
      const publicUrl = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      if (publicUrl !== activeAvatar && !activeAvatar.endsWith(f.name)) {
        orphanAvatarPaths.push(path);
        freedBytes += Number(f.metadata?.size || 0);
      }
    }

    if (orphanAvatarPaths.length > 0) {
      await admin.storage.from("avatars").remove(orphanAvatarPaths);
      deletedCount += orphanAvatarPaths.length;
    }

    // 3. Check media bucket: any post media that is not attached to any post is orphaned
    const mediaFiles = mediaRes.data || [];
    const orphanMediaPaths: string[] = [];

    for (const f of mediaFiles) {
      const path = `${userId}/${f.name}`;
      const publicUrl = admin.storage.from("media").getPublicUrl(path).data.publicUrl;
      const isReferenced = Array.from(activeMediaUrls).some((url) => url === publicUrl || url.endsWith(f.name));
      if (!isReferenced) {
        orphanMediaPaths.push(path);
        freedBytes += Number(f.metadata?.size || 0);
      }
    }

    if (orphanMediaPaths.length > 0) {
      await admin.storage.from("media").remove(orphanMediaPaths);
      deletedCount += orphanMediaPaths.length;
    }

    invalidateStorageCache(userId);
  } catch (err) {
    console.warn("cleanupOrphanedFiles error:", err);
  }

  return { deletedCount, freedBytes };
}
