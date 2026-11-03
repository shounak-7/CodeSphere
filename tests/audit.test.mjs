import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "https://codesphere-eight-phi.vercel.app";

console.log(`Starting E2E Reliability and Production Audit Verification against: ${BASE_URL}\n`);

async function testCompilerTimeout() {
  console.log("1. Testing Compiler Execution Timeout (> 4s execution)...");
  const payload = {
    code: `#include <stdio.h>\n#include <unistd.h>\nint main() {\n    sleep(5);\n    printf("Execution completed after 5 seconds successfully!\\n");\n    return 0;\n}`,
    stdin: "",
    timeoutMs: 15000,
  };

  const res = await fetch(`${BASE_URL}/api/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const data = await res.json();
  console.log("   Result:", data);
  assert.equal(data.success, true, "Program should have succeeded");
  assert.equal(data.exitCode, 0, "Exit code should be 0");
  assert.ok(data.durationMs >= 4500, `Expected duration >= 4500ms, got ${data.durationMs}ms`);
  assert.match(data.stdout, /Execution completed after 5 seconds/);
  console.log("   ✓ Compiler execution exceeded 4s limit without termination! Passed.\n");
}

async function testCompilerStandardC11() {
  console.log("2. Testing Standard C11 Program & Math Library...");
  const payload = {
    code: `#include <stdio.h>\n#include <math.h>\nint main() {\n    double root = sqrt(144.0);\n    printf("Square root of 144 is: %.2f\\n", root);\n    return 0;\n}`,
  };

  const res = await fetch(`${BASE_URL}/api/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.exitCode, 0);
  assert.match(data.stdout, /Square root of 144 is: 12.00/);
  console.log("   ✓ C11 math execution succeeded. Duration:", data.durationMs, "ms.\n");
}

async function testPostsApi() {
  console.log("3. Testing Community Posts API...");
  const res = await fetch(`${BASE_URL}/api/posts`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.posts), "Expected posts array");
  console.log(`   ✓ Fetched ${data.posts.length} real posts from cloud database.`);
  if (data.posts.length > 0) {
    const post = data.posts[0];
    assert.ok(post.id, "Post has id");
    assert.ok(post.author, "Post has author profile attached");
    console.log(`   ✓ Latest post author: @${post.author.username} (${post.author.full_name})`);
  }
  console.log();
}

async function testTagsApi() {
  console.log("4. Testing Trending Tags API...");
  const res = await fetch(`${BASE_URL}/api/tags/trending`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.tags));
  console.log(`   ✓ Trending tags active: ${data.tags.length} tags returned.\n`);
}

async function testBookmarksContract() {
  console.log("5. Testing Bookmarks Endpoint Contract...");
  const res = await fetch(`${BASE_URL}/api/bookmarks`);
  // Without user cookie, should return 200 with empty list or 401
  assert.ok(res.status === 200 || res.status === 401);
  const data = await res.json();
  if (res.status === 200) {
    assert.ok(Array.isArray(data.bookmarks));
    console.log("   ✓ Bookmarks schema valid.");
  }
  console.log();
}

async function testNotificationsContract() {
  console.log("6. Testing Notifications Endpoint Contract...");
  const res = await fetch(`${BASE_URL}/api/notifications`);
  assert.ok(res.status === 200 || res.status === 401);
  const data = await res.json();
  if (res.status === 200) {
    assert.ok(Array.isArray(data.notifications));
    console.log("   ✓ Notifications schema valid.");
  }
  console.log();
}

async function runAll() {
  try {
    await testCompilerStandardC11();
    await testCompilerTimeout();
    await testPostsApi();
    await testTagsApi();
    await testBookmarksContract();
    await testNotificationsContract();
    console.log("=================================================");
    console.log("ALL VERIFICATION SUITES PASSED ON PRODUCTION!");
    console.log("=================================================");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

runAll();
