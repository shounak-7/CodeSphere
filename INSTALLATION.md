# CodeSphere Local Installation & Setup Guide

## 1. System Requirements

- **Node.js**: v18.0.0 or higher (Tested with Node v24 LTS).
- **Package Manager**: `npm` (v9+), `pnpm`, or `yarn`.
- **C Compiler**: GCC with C11 support (`/usr/bin/gcc` or Apple Clang on macOS, `gcc` on Linux/Debian/Ubuntu).
- **Operating System**: macOS, Linux, or Windows (via WSL2).

---

## 2. Step-by-Step Installation

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/CodeSphere.git
cd CodeSphere
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```
Fill in the credentials:
```env
# Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Google Cloud OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key

# Compiler Service
COMPILER_SERVICE_URL=http://localhost:4000
COMPILER_API_SECRET=codesphere-sandbox-compiler-secret-key-2026

# Application Domain
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Database Initialization (Supabase)

1. Open the Supabase SQL Editor.
2. Open `supabase/migrations/20261101000000_init_schema.sql` in this repo.
3. Paste all SQL and click **Run**.
4. In the Supabase Dashboard under **Authentication > Providers > Google**:
   - Turn on Google
   - Paste your Google OAuth Client ID and Client Secret
   - Add authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback` and `http://localhost:3000/auth/callback`.

---

## 4. Running the Development Servers

### Start Next.js Web Application:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### (Optional) Start Standalone Compiler Sandbox Microservice:
```bash
cd compiler-service
npm start
```
Runs on `http://localhost:4000`. If this is not started, the Next.js API automatically falls back to direct sandboxed GCC execution without downtime.
