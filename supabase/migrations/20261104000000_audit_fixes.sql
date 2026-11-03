-- ====================================================================
-- CodeSphere Production Reliability & Realtime Audit Fixes
-- Migration: 20261104000000_audit_fixes.sql
-- ====================================================================

-- 1. REALTIME PUBLICATIONS
-- Enable Supabase Realtime for instant notification, comment, and like feeds
DO $$
BEGIN
    -- Add notifications to supabase_realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    -- Add comments to supabase_realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;

    -- Add post_likes to supabase_realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
    END IF;

    -- Add follows to supabase_realtime
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'follows'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
    END IF;
END $$;

-- 2. NOTIFICATIONS RLS POLICIES
-- Ensure authenticated users and server handlers can insert and delete notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;
CREATE POLICY "Users can view only their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = recipient_id);

-- 3. ATOMIC COUNT TRIGGERS
-- Automatically maintain accurate likes_count on posts
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET likes_count = (SELECT count(*) FROM public.post_likes WHERE post_id = NEW.post_id),
            updated_at = NOW()
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET likes_count = (SELECT count(*) FROM public.post_likes WHERE post_id = OLD.post_id),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_sync_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

-- Automatically maintain accurate comments_count on posts
CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts 
        SET comments_count = (SELECT count(*) FROM public.comments WHERE post_id = NEW.post_id),
            updated_at = NOW()
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts 
        SET comments_count = (SELECT count(*) FROM public.comments WHERE post_id = OLD.post_id),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_comments_count ON public.comments;
CREATE TRIGGER trg_sync_post_comments_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

-- 4. PERFORMANCE & HIGH-CONCURRENCY INDEXES
CREATE INDEX IF NOT EXISTS idx_post_likes_composite ON public.post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_target ON public.bookmarks(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_both ON public.follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_posts_type_created ON public.posts(post_type, created_at DESC);
