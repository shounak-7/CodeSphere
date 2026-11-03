-- ====================================================================
-- CodeSphere Database Initialization & Security Schema
-- Author: CodeSphere Architecture Team
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    college TEXT,
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index on username for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_folders_owner ON public.folders(owner_id);

-- 3. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source_code TEXT NOT NULL DEFAULT '',
    language TEXT DEFAULT 'c' NOT NULL,
    category TEXT DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    is_favorite BOOLEAN DEFAULT FALSE NOT NULL,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_programs_owner ON public.programs(owner_id);
CREATE INDEX IF NOT EXISTS idx_programs_visibility ON public.programs(visibility);
CREATE INDEX IF NOT EXISTS idx_programs_category ON public.programs(category);

-- 4. PROGRAM VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.program_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    source_code TEXT NOT NULL,
    change_description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(program_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_program_versions_prog ON public.program_versions(program_id);

-- 5. POSTS TABLE (Social Feed)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'code', 'achievement', 'question', 'update')),
    code_snippet TEXT,
    language TEXT DEFAULT 'c',
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0 NOT NULL,
    comments_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 6. POST LIKES TABLE
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);

-- 8. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY(follower_id, following_id),
    CONSTRAINT prevent_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- 9. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'program', 'collection')),
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);

-- 10. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_owner ON public.collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON public.collections(visibility);

-- 11. COLLECTION PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.collection_programs (
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0 NOT NULL,
    PRIMARY KEY(collection_id, program_id)
);

-- 12. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 13. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);

-- 14. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    read_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at ASC);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    reference_id UUID NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);

-- 16. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'program', 'user')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 17. USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    PRIMARY KEY(blocker_id, blocked_id),
    CONSTRAINT prevent_self_block CHECK (blocker_id != blocked_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- FOLDERS POLICIES
CREATE POLICY "Users can view only their own folders" 
    ON public.folders FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own folders" 
    ON public.folders FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own folders" 
    ON public.folders FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own folders" 
    ON public.folders FOR DELETE USING (auth.uid() = owner_id);

-- PROGRAMS POLICIES
CREATE POLICY "Users can view their own programs or public programs" 
    ON public.programs FOR SELECT 
    USING (auth.uid() = owner_id OR visibility = 'public');

CREATE POLICY "Users can insert their own programs" 
    ON public.programs FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own programs" 
    ON public.programs FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own programs" 
    ON public.programs FOR DELETE USING (auth.uid() = owner_id);

-- PROGRAM VERSIONS POLICIES
CREATE POLICY "Only owners can view program versions" 
    ON public.program_versions FOR SELECT 
    USING (auth.uid() = owner_id);

CREATE POLICY "Only owners can create program versions" 
    ON public.program_versions FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- POSTS POLICIES
CREATE POLICY "Anyone can view posts" 
    ON public.posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" 
    ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" 
    ON public.posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts" 
    ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- POST LIKES POLICIES
CREATE POLICY "Anyone can view post likes" 
    ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like posts" 
    ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" 
    ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Anyone can view comments" 
    ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
    ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own comments" 
    ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- FOLLOWS POLICIES
CREATE POLICY "Anyone can view follows" 
    ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow other users" 
    ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
    ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- BOOKMARKS POLICIES
CREATE POLICY "Users can view only their own bookmarks" 
    ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert bookmarks" 
    ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks" 
    ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- COLLECTIONS POLICIES
CREATE POLICY "Users can view public collections or their own" 
    ON public.collections FOR SELECT 
    USING (auth.uid() = owner_id OR visibility = 'public');

CREATE POLICY "Users can create collections" 
    ON public.collections FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own collections" 
    ON public.collections FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own collections" 
    ON public.collections FOR DELETE USING (auth.uid() = owner_id);

-- COLLECTION PROGRAMS POLICIES
CREATE POLICY "Collection programs visible if collection is visible" 
    ON public.collection_programs FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c 
            WHERE c.id = collection_id 
            AND (c.owner_id = auth.uid() OR c.visibility = 'public')
        )
        AND
        EXISTS (
            SELECT 1 FROM public.programs p 
            WHERE p.id = program_id 
            AND (p.owner_id = auth.uid() OR p.visibility = 'public')
        )
    );

CREATE POLICY "Collection owners can manage collection programs" 
    ON public.collection_programs FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections c 
            WHERE c.id = collection_id AND c.owner_id = auth.uid()
        )
    );

CREATE POLICY "Collection owners can remove collection programs" 
    ON public.collection_programs FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.collections c 
            WHERE c.id = collection_id AND c.owner_id = auth.uid()
        )
    );

-- CONVERSATIONS & PARTICIPANTS POLICIES
CREATE POLICY "Participants can view their conversations" 
    ON public.conversations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create conversations" 
    ON public.conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can view conversation participants" 
    ON public.conversation_participants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations" 
    ON public.conversation_participants FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- MESSAGES POLICIES
CREATE POLICY "Only conversation participants can view messages" 
    ON public.messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Only conversation participants can send messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
        )
    );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view only their own notifications" 
    ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- REPORTS POLICIES
CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- USER BLOCKS POLICIES
CREATE POLICY "Users can view their own block list" 
    ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users" 
    ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" 
    ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- ====================================================================
-- AUTOMATIC PROFILE CREATION ON NEW AUTH USER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    clean_username TEXT;
    base_username TEXT;
BEGIN
    -- Derive username from email or raw user metadata
    base_username := LOWER(SPLIT_PART(COALESCE(NEW.email, 'coder'), '@', 1));
    clean_username := REGEXP_REPLACE(base_username, '[^a-zA-Z0-9_]', '', 'g');
    
    IF clean_username = '' THEN
        clean_username := 'dev';
    END IF;
    
    -- Ensure uniqueness by appending user ID suffix if taken
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) THEN
        clean_username := clean_username || '_' || SUBSTRING(NEW.id::text, 1, 6);
    END IF;

    INSERT INTO public.profiles (
        id, 
        username, 
        full_name, 
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        clean_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', clean_username),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
