# CodeSphere Security Architecture & Threat Model

## 1. Database Row Level Security (RLS)

All 17 application tables enforce PostgreSQL Row Level Security.
- **Private Code Guarantee**: The database policy `auth.uid() = owner_id OR visibility = 'public'` ensures that under no circumstances can an attacker query another user's private C programs, even if they guess the program's UUID.
- **Bookmarks Privacy**: `auth.uid() = user_id` ensures bookmarks are never visible to anyone except the owner.
- **Direct Messaging Privacy**: Both read and write operations are strictly conditioned on `EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = ... AND user_id = auth.uid())`.
- **Zero Client Service Key Leakage**: `SUPABASE_SERVICE_ROLE_KEY` is exclusively read inside server-only Node.js contexts (`process.env`), never embedded in Next.js browser client bundles.

---

## 2. C Compiler Execution Engine Isolation

- **Non-Root Execution**: Docker container runs under `sandboxuser` with zero root privileges.
- **Resource Constraints**:
  - Maximum code size: 256 KB.
  - Maximum stdin input: 64 KB.
  - Maximum stdout/stderr buffer: 1 MB.
  - Hard CPU & Clock Timeout: 4.0 seconds (hard kill via `SIGKILL` on timeout).
- **Ephemeral Workspaces**: Each compilation is assigned a unique UUID in a temporary directory (`/tmp/cs-exec-[uuid]`), compiled, executed, and immediately deleted via a `finally` block.
- **Denial-of-Service Defense**: API secret verification via `x-compiler-secret` header prevents unauthorized external compilation requests.

---

## 3. Gemini AI Code Explainer Security

- Server-side abstraction: `GEMINI_API_KEY` is kept strictly server-side.
- Input validation: Zod enforces source code length boundaries.
- Defensive model fallback: Handles model deprecation or temporary spikes across `gemini-3.5-flash`, `gemini-3.8-flash`, and preview models with clean error messages.
