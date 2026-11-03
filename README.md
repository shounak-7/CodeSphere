# CodeSphere 🌐

**Code. Save. Share. Connect.**

A production-ready social networking and personal cloud workspace platform for C programmers, college students, and DSA learners.

---

## 🌟 Key Features

1. **Personal VS Code C Workspace**:
   - Integrated Monaco Editor with C11 syntax highlighting, smart indentation, bracket matching, and custom fonts.
   - Private-by-default cloud storage for C programs.
   - Folder trees, categories (DSA, Systems, Algorithms, Lab Programs), and favorites.
   - Robust autosave with debouncing and change status indicators.
   - Single-click `.c` source code download and clipboard copying.

2. **Full GCC C11 Compiler Sandbox**:
   - Real online C compiler powered by GCC (standard C11 with `-O2 -Wall -lm`).
   - Supports complex DSA programs: pointers, recursion, dynamic memory allocation (`malloc`/`free`), linked lists, circular queues, binary search trees, sorting, and infix/postfix parsing.
   - Interactive stdin support for multi-input `scanf` programs.
   - Strong sandboxing: execution timeout caps (max 5s), process isolation, output buffering (1MB cap), and non-root execution.

3. **Gemini AI Code Tutor & DSA Assistant**:
   - Server-side integration with Google Gemini AI (`gemini-3.5-flash` / `gemini-3.8-flash`).
   - Comprehensive analysis modes:
     - 📋 Complete Program Breakdown
     - 🌱 Beginner-Friendly Explanation (analogies for pointers and memory)
     - ⏱️ Rigorous Big-O Time & Space Complexity Derivation
     - 🧠 Logic Flow & Algorithm Strategy
     - 🔍 Line-by-Line Code Walkthrough
     - 🐞 Bug, Memory Leak, and Undefined Behavior Detection
     - 💡 Modern C11 Idiomatic Improvements

4. **Community Social Feed**:
   - Post types: Text discussions, DSA questions, code snippets, achievements, and updates.
   - Rich code snippet preview with syntax formatting, copy button, and "Explain with AI".
   - Optimistic likes, threaded comments, bookmarking, and direct post sharing.
   - Following system with duplicate prevention.

5. **Curated Public Code Collections**:
   - Organize and publish collections (e.g. *Binary Search Tree Mastery*, *MAKAUT DSA Lab Programs*).
   - Strict privacy boundary: Private programs are never exposed in public collections.

6. **Code Version History**:
   - Checkpoint tracking for code changes.
   - Preview historical versions and safely restore older code (creates a new checkpoint without destroying history).

7. **Direct Developer Messaging**:
   - Real-time 1-on-1 private messaging between developers.
   - Strict participant-only authorization.

8. **Design System & Visual Identity**:
   - SaaS developer aesthetic with deep navy/charcoal dark mode and clean light mode.
   - Independent Monaco editor theme setting (does not force editor theme change when platform theme toggles).

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS, Monaco Editor, Zustand, Lucide Icons.
- **Backend**: Next.js Server Route Handlers, Zod schema validation.
- **Database & Auth**: Supabase PostgreSQL with 17 normalized tables, Row Level Security (RLS), and Google OAuth.
- **Compiler Sandbox**: GCC 11 isolated runner microservice with Docker containerization support.
- **AI**: Google Generative AI (Gemini 3.5/3.8 Flash).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- GCC (`/usr/bin/gcc` or equivalent)

### 2. Install & Configure
```bash
git clone <repo>
cd CodeSphere
npm install
cp .env.example .env.local
```

### 3. Apply Supabase Database Schema
Follow the 1-click SQL migration steps in [DATABASE.md](./DATABASE.md).

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
