# CodeSphere Production Deployment Guide

CodeSphere is architected for seamless separation of concerns:
- **Next.js Frontend & API Handlers**: Deployed on **Vercel**.
- **PostgreSQL Database & Realtime Auth**: Hosted on **Supabase**.
- **GCC C11 Execution Sandbox**: Containerized microservice deployable on **Railway**, **Render**, **Fly.io**, or any standard Linux VPS with Docker.

---

## 1. Deploying Frontend to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import the `CodeSphere` repository.
4. Set the following Environment Variables in the Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-supabase-service-role-key`
   - `GOOGLE_CLIENT_ID`: `your-google-client-id.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: `your-google-client-secret`
   - `GEMINI_API_KEY`: `your-gemini-api-key`
   - `COMPILER_SERVICE_URL`: `https://your-compiler-service.onrender.com`
   - `NEXT_PUBLIC_COMPILER_SERVICE_URL`: `https://your-compiler-service.onrender.com`
   - `COMPILER_API_SECRET`: `codesphere-sandbox-compiler-secret-key-2026`
   - `NEXT_PUBLIC_APP_URL`: `https://your-app.vercel.app`
5. Click **Deploy**.

---

## 2. Deploying Compiler Sandbox to Railway / Render / Fly.io

The isolated compiler service is located in `compiler-service/` and contains its own Alpine-based Dockerfile.

### Deploying via Docker:
```bash
cd compiler-service
docker build -t codesphere-compiler .
docker run -d -p 4000:4000 \
  -e PORT=4000 \
  -e COMPILER_API_SECRET=codesphere-sandbox-compiler-secret-key-2026 \
  --name codesphere-sandbox \
  codesphere-compiler
```

### Health Check:
```bash
curl http://localhost:4000/health
# Returns: {"status":"ok","service":"CodeSphere GCC Compiler Service", ...}
```

---

## 3. Configuring Google Cloud OAuth

1. Open Google Cloud Console > APIs & Services > Credentials.
2. Select your Web OAuth Client ID.
3. In **Authorized redirect URIs**, add:
   - `https://vbaidzwcilhydeysewnz.supabase.co/auth/v1/callback`
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
4. Save changes.
