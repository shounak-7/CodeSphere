# CodeSphere Online C Compiler & Sandbox Specification

## 1. Specification

- **Compiler**: GCC (GNU Compiler Collection).
- **Language Standard**: ISO/IEC 9899:2011 (Standard C11).
- **Compilation Flags**: `-std=c11 -O2 -Wall -Wextra -lm`
- **Supported Headers**:
  - `<stdio.h>`, `<stdlib.h>`, `<string.h>`, `<math.h>`
  - `<stdbool.h>`, `<stdint.h>`, `<ctype.h>`, `<limits.h>`
  - `<stdarg.h>`, `<time.h>`, `<assert.h>`

---

## 2. Supported Programming & DSA Concepts

The execution sandbox natively executes:
- Variables, operators, conditional branches, loops.
- Arrays and string manipulations.
- Functions, recursion (Factorial, Fibonacci, Tower of Hanoi).
- Pointer arithmetic, double pointers, function pointers.
- Structures, unions, and bitfields.
- Dynamic memory management: `malloc()`, `calloc()`, `realloc()`, and `free()`.
- Singly and Doubly Linked Lists.
- Stacks and Queues (including Circular Queues).
- Binary Trees and Binary Search Trees (insertion, deletion, in-order/pre-order traversals).
- Sorting algorithms: Bubble, Insertion, Selection, Merge Sort, Quick Sort.
- Expression parsing: Infix to Postfix evaluation.

---

## 3. Sandboxing & Timeout Handling

- If code contains an infinite loop:
  ```c
  while(1) {}
  ```
  The execution watchdog terminates the process at the timeout threshold (e.g. 4 seconds) and returns:
  `Time Limit Exceeded: Process terminated after 4.0 seconds.`
- Custom stdin input is passed via child process stdin streams, handling multiple `scanf()` calls accurately.

---

## 4. Verification Suite

CodeSphere includes a standalone test runner in `tests/compiler.test.mjs` verifying:
- Infix to Postfix evaluation
- Circular queue operations
- Binary search tree insertion and traversal
- Multiple `scanf` stdin inputs
- Infinite loop timeout protection

Run tests:
```bash
node --test tests/compiler.test.mjs
```
