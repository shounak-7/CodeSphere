-- ==============================================================================
-- CODESPHERE STORAGE QUOTA SYSTEM MIGRATION
-- Total Limit: 30 MB (31,457,280 bytes)
-- Code Allocation: 10 MB (10,485,760 bytes)
-- Avatar Allocation: 2 MB (2,097,152 bytes)
-- Post Media Allocation: 18 MB (18,874,368 bytes)
-- ==============================================================================

-- 1. Ensure public.posts has media_url column for attachments
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 2. User Storage Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.user_storage_usage (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    code_bytes BIGINT NOT NULL DEFAULT 0,
    media_bytes BIGINT NOT NULL DEFAULT 0,
    total_bytes BIGINT NOT NULL DEFAULT 0,
    max_total_bytes BIGINT NOT NULL DEFAULT 31457280,   -- 30 MB
    max_code_bytes BIGINT NOT NULL DEFAULT 10485760,    -- 10 MB
    max_media_bytes BIGINT NOT NULL DEFAULT 18874368,   -- 18 MB
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_storage_usage_user ON public.user_storage_usage(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_storage_usage ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only select their own storage usage
DROP POLICY IF EXISTS "Users can read own storage usage" ON public.user_storage_usage;
CREATE POLICY "Users can read own storage usage"
    ON public.user_storage_usage
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 3. User Media Files Tracking Table
CREATE TABLE IF NOT EXISTS public.user_media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_id TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('avatar', 'post_media', 'attachment')),
    public_url TEXT NOT NULL,
    is_orphaned BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_media_files_user ON public.user_media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_files_type ON public.user_media_files(user_id, file_type);

-- Enable Row Level Security
ALTER TABLE public.user_media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own media files" ON public.user_media_files;
CREATE POLICY "Users can read own media files"
    ON public.user_media_files
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 4. Function: Calculate live user storage
CREATE OR REPLACE FUNCTION public.calculate_user_storage(target_user_id UUID)
RETURNS TABLE (
    code_bytes BIGINT,
    media_bytes BIGINT,
    total_bytes BIGINT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_programs_bytes BIGINT := 0;
    v_versions_bytes BIGINT := 0;
    v_media_bytes BIGINT := 0;
BEGIN
    -- Sum of programs source_code
    SELECT COALESCE(SUM(octet_length(COALESCE(source_code, ''))), 0)
    INTO v_programs_bytes
    FROM public.programs
    WHERE owner_id = target_user_id;

    -- Sum of program_versions source_code
    SELECT COALESCE(SUM(octet_length(COALESCE(source_code, ''))), 0)
    INTO v_versions_bytes
    FROM public.program_versions
    WHERE owner_id = target_user_id;

    -- Sum of active media files
    SELECT COALESCE(SUM(file_size), 0)
    INTO v_media_bytes
    FROM public.user_media_files
    WHERE user_id = target_user_id AND is_orphaned = false;

    RETURN QUERY SELECT
        (v_programs_bytes + v_versions_bytes) AS code_bytes,
        v_media_bytes AS media_bytes,
        (v_programs_bytes + v_versions_bytes + v_media_bytes) AS total_bytes;
END;
$$;

-- 5. Function: Synchronize user storage table
CREATE OR REPLACE FUNCTION public.sync_user_storage(target_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_code BIGINT;
    v_media BIGINT;
    v_total BIGINT;
BEGIN
    SELECT code_bytes, media_bytes, total_bytes
    INTO v_code, v_media, v_total
    FROM public.calculate_user_storage(target_user_id);

    INSERT INTO public.user_storage_usage (
        user_id, code_bytes, media_bytes, total_bytes, updated_at
    )
    VALUES (
        target_user_id, COALESCE(v_code, 0), COALESCE(v_media, 0), COALESCE(v_total, 0), TIMEZONE('utc', NOW())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        code_bytes = EXCLUDED.code_bytes,
        media_bytes = EXCLUDED.media_bytes,
        total_bytes = EXCLUDED.total_bytes,
        updated_at = EXCLUDED.updated_at;
END;
$$;
