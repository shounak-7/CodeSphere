-- ====================================================================
-- CodeSphere Database Performance & Verification Migration
-- Migration: 20261105010000_verify_and_indexes.sql
-- Run this in your Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. ADD IS_VERIFIED COLUMN TO PROFILES TABLE
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. CREATE INDEX FOR VERIFIED PROFILES LOOKUPS
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);

-- 3. PERMANENTLY VERIFY OFFICIAL TEAM ACCOUNT & VERIFIED USERS
UPDATE public.profiles 
SET is_verified = TRUE 
WHERE lower(username) IN ('codesphere', 'team');

-- 4. MISSING BTREE INDEXES FROM SUPABASE INDEX ADVISOR
-- (Eliminates table scans and query queue contention across PostgREST)

-- Fast lookup of programs inside collections (replaces sequential scans in /api/collections)
CREATE INDEX IF NOT EXISTS idx_collection_programs_collection_id 
ON public.collection_programs USING btree (collection_id);

-- Fast lookup of following relationships (eliminates lateral join delays in profile networks)
CREATE INDEX IF NOT EXISTS idx_follows_follower_id 
ON public.follows USING btree (follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following_id 
ON public.follows USING btree (following_id);

-- Fast sorting of programs by last updated timestamp
CREATE INDEX IF NOT EXISTS idx_programs_updated_at 
ON public.programs USING btree (updated_at DESC);

-- Fast chronological notification feed (eliminates sorting bottleneck for notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created 
ON public.notifications USING btree (recipient_id, created_at DESC);

-- Fast author-based posts query
CREATE INDEX IF NOT EXISTS idx_posts_author_created 
ON public.posts USING btree (author_id, created_at DESC);

-- Fast user bookmarks query
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created 
ON public.bookmarks USING btree (user_id, created_at DESC);
