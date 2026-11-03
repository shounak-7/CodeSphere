/**
 * CodeSphere Sandbox Runner
 * High-performance setuid wrapper for Alpine Linux Docker container.
 * Drops privileges to sandboxuser (UID 1002, GID 1002), enforces kernel rlimits,
 * isolates process group, and clears all parent environment variables.
 */

#include <sys/resource.h>
#include <sys/types.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

#define SANDBOX_UID 1002
#define SANDBOX_GID 1002

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: sandbox-runner <binary_path> [args...]\n");
        return 1;
    }

    // 1. Enforce Kernel Resource Limits (rlimits)
    // Prevent fork-bombs: maximum 16 concurrent processes/threads for this user
    struct rlimit rl_nproc = { 16, 16 };
    setrlimit(RLIMIT_NPROC, &rl_nproc);

    // Maximum CPU execution time (10s soft, 12s hard)
    struct rlimit rl_cpu = { 10, 12 };
    setrlimit(RLIMIT_CPU, &rl_cpu);

    // Maximum virtual memory address space: 256 MB
    struct rlimit rl_as = { 256ULL * 1024ULL * 1024ULL, 256ULL * 1024ULL * 1024ULL };
    setrlimit(RLIMIT_AS, &rl_as);

    // Maximum output file size write: 10 MB
    struct rlimit rl_fsize = { 10ULL * 1024ULL * 1024ULL, 10ULL * 1024ULL * 1024ULL };
    setrlimit(RLIMIT_FSIZE, &rl_fsize);

    // 2. Isolate process group (prevents signals from crossing to parent Node server)
    setsid();

    // 3. Drop all privileges to unprivileged sandboxuser (UID 1002)
    if (setgid(SANDBOX_GID) != 0) {
        perror("sandbox-runner: setgid failed");
        return 1;
    }
    if (setuid(SANDBOX_UID) != 0) {
        perror("sandbox-runner: setuid failed");
        return 1;
    }

    // 4. Strict Sanitized Environment (ZERO leakage of Node.js secrets or keys)
    char *clean_env[] = {
        "PATH=/usr/local/bin:/usr/bin:/bin",
        "LANG=en_US.UTF-8",
        "LC_ALL=en_US.UTF-8",
        "TMPDIR=/tmp",
        "HOME=/tmp",
        NULL
    };

    // 5. Execute compiled student binary
    execve(argv[1], &argv[1], clean_env);
    perror("sandbox-runner: execve failed");
    return 1;
}
