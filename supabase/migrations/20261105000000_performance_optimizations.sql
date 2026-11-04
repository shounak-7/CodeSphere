-- ====================================================================
-- CodeSphere Performance Engineering: Indexes & Query Optimizations
-- Migration: 20261105000000_performance_optimizations.sql
-- ====================================================================

-- 1. GIN index for fast array tag filtering on posts (replaces sequential scans)
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);

-- 2. Expression index for case-insensitive profile username lookups (accelerates ilike/lower)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));

-- 3. Composite indexes for user workspace programs and collections ordering
CREATE INDEX IF NOT EXISTS idx_programs_owner_updated ON public.programs (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_owner_updated ON public.collections (owner_id, updated_at DESC);

-- 4. Fast foreign key lookup on collection_programs for reverse joins
CREATE INDEX IF NOT EXISTS idx_collection_programs_prog ON public.collection_programs (program_id);

-- 5. Fast message history traversal index
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages (conversation_id, created_at ASC);

-- 6. Optimized composite index for public posts feed ordering with type
CREATE INDEX IF NOT EXISTS idx_posts_feed_ordering ON public.posts (post_type, created_at DESC) WHERE (post_type IS NOT NULL);

-- 7. Optimized RLS initplan subquery for collection_programs
DROP POLICY IF EXISTS "Collection programs visible if collection is visible" ON public.collection_programs;
CREATE POLICY "Collection programs visible if collection is visible" 
    ON public.collection_programs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c 
            WHERE c.id = collection_id 
            AND (c.owner_id = (SELECT auth.uid()) OR c.visibility = 'public')
        )
    );
