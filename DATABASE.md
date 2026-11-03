# CodeSphere Database & Security Architecture

## 1. PostgreSQL Schema Overview (Supabase)

CodeSphere is backed by PostgreSQL 15+ hosted on Supabase, structured into 17 normalized tables with comprehensive Row Level Security (RLS) policies.

### Core Tables
1. **`profiles`**: User public identity (username, full_name, avatar_url, bio, college, skills). Automatically populated on first Google login via the `on_auth_user_created` trigger on `auth.users`.
2. **`folders`**: User-defined workspace directory tree.
3. **`programs`**: User C programs. **Default visibility is `'private'`**.
4. **`program_versions`**: Historical checkpoints for saved code with version numbering and descriptions.
5. **`posts`**: Community feed publications (discussions, code snippets, DSA questions, achievements).
6. **`post_likes`**: Unique post likes (`UNIQUE(post_id, user_id)`).
7. **`comments`**: Threaded post discussions.
8. **`follows`**: Social developer network graph (`PRIMARY KEY(follower_id, following_id)`, self-follow prevented by check constraint).
9. **`bookmarks`**: Private saved posts, programs, or collections (`UNIQUE(user_id, target_type, target_id)`).
10. **`collections`**: Curated public lists of programs (e.g. "BST Mastery", "DSA Lab").
11. **`collection_programs`**: Join table mapping programs to collections with positioning.
12. **`conversations` & `conversation_participants`**: 1-on-1 developer messaging rooms.
13. **`messages`**: Encrypted text messages between conversation participants.
14. **`notifications`**: In-app notifications for likes, follows, and comments.
15. **`reports`**: Moderation reporting table for community safety.
16. **`user_blocks`**: Mutual communication blocking.

---

## 2. Applying Database Migrations

To apply the complete database schema in 1 click:
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/vbaidzwcilhydeysewnz/sql](https://supabase.com/dashboard/project/vbaidzwcilhydeysewnz/sql)
2. Open the file `supabase/migrations/20261101000000_init_schema.sql` in this repo.
3. Paste the contents into the Supabase SQL Editor and click **Run**.
4. All tables, indexes, constraints, triggers, and Row Level Security policies will be established instantaneously.

---

## 3. Row Level Security (RLS) Guarantees

- **Programs Isolation**:
  ```sql
  CREATE POLICY "Users can view their own programs or public programs" 
      ON public.programs FOR SELECT 
      USING (auth.uid() = owner_id OR visibility = 'public');
  ```
  A user cannot access, modify, or delete another user's private programs under any circumstances, even with guessed UUID URLs.
- **Messaging Privacy**:
  Only registered participants in `conversation_participants` can query or post to `messages`.
- **Bookmarks Privacy**:
  Users can only query their own bookmarks (`auth.uid() = user_id`).
- **Collections Integrity**:
  Public collections strictly filter out programs that are private. If a user reverts a program from public to private, it automatically disappears from public collection views.
