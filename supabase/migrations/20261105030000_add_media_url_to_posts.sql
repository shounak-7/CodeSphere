-- Migration: Add media_url to posts if not exists
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Index for posts with media
CREATE INDEX IF NOT EXISTS idx_posts_media_url ON public.posts(media_url) WHERE media_url IS NOT NULL;
