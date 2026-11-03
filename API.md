# CodeSphere API Reference

All API routes are served under `/api` and validated using Zod.

---

## 1. Compiler API

### `POST /api/compile`
Compiles and executes C code in the sandbox.
- **Request Body**:
  ```json
  {
    "code": "#include <stdio.h>\nint main() { printf(\"Hello\"); return 0; }",
    "stdin": "optional input",
    "timeoutMs": 4000
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "phase": "execution",
    "stdout": "Hello",
    "stderr": "",
    "exitCode": 0,
    "durationMs": 42
  }
  ```

---

## 2. Gemini AI Explanation API

### `POST /api/explain`
Analyzes C source code and generates pedagogical explanations.
- **Request Body**:
  ```json
  {
    "code": "/* C source code */",
    "mode": "complete | beginner | complexity | logic | line_by_line | bugs | improvements"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "explanation": "### 1. Overview...\n### 2. Time & Space Complexity: O(N)...",
    "mode": "complete"
  }
  ```

---

## 3. Programs Workspace API

- `GET /api/programs`: List all programs owned by the authenticated user.
- `POST /api/programs`: Create a new program. **Always private by default.**
- `GET /api/programs/:id`: Fetch program details (enforces ownership or public visibility).
- `PUT /api/programs/:id`: Update program source code, title, category, tags, or toggle visibility.
- `DELETE /api/programs/:id`: Delete a program (owner only).
- `GET /api/programs/:id/versions`: Fetch version checkpoints.
- `POST /api/programs/:id/restore`: Restores an older version and generates a new current checkpoint.

---

## 4. Community & Social Feed API

- `GET /api/posts?tab=latest|questions`: Fetch social feed posts with like status.
- `POST /api/posts`: Create a post with optional attached C code snippet.
- `DELETE /api/posts/:id`: Delete post (author only).
- `POST /api/posts/:id/like`: Toggle like on post.
- `GET /api/posts/:id/comments`: Fetch post comments.
- `POST /api/posts/:id/comments`: Add a comment.
- `DELETE /api/comments/:id`: Delete a comment.

---

## 5. Curated Collections API

- `GET /api/collections`: Fetch public collections.
- `POST /api/collections`: Create a new collection.
- `GET /api/collections/:id`: Fetch collection and verified public programs.
- `DELETE /api/collections/:id`: Delete collection (owner only).

---

## 6. Messaging & Bookmarks API

- `GET /api/messages`: List user conversations.
- `GET /api/messages?conversationId=:id`: Fetch messages for conversation.
- `POST /api/messages`: Send a message to a conversation or recipient.
- `GET /api/bookmarks`: Fetch owner's bookmarks.
- `POST /api/bookmarks`: Toggle bookmark on a post, program, or collection.
- `GET /api/notifications`: Fetch user notifications.
- `PUT /api/notifications`: Mark all notifications as read.
