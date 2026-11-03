import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeCProgram } from '../src/executor.js';

test('1. Hello World execution', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      printf("Hello, CodeSphere!\\n");
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, true);
  assert.match(result.stdout, /Hello, CodeSphere!/);
  assert.equal(result.phase, 'execution');
});

test('2. scanf and printf with stdin', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      int a, b;
      if (scanf("%d %d", &a, &b) == 2) {
        printf("SUM: %d\\n", a + b);
      }
      return 0;
    }
  `;
  const result = await executeCProgram({ code, stdin: '15 27' });
  assert.equal(result.success, true);
  assert.match(result.stdout, /SUM: 42/);
});

test('3. Recursive Factorial and Pointers', async () => {
  const code = `
    #include <stdio.h>
    long long fact(int n) {
      if (n <= 1) return 1;
      return n * fact(n - 1);
    }
    int main() {
      int num = 6;
      int *ptr = &num;
      printf("FACT: %lld\\n", fact(*ptr));
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, true);
  assert.match(result.stdout, /FACT: 720/);
});

test('4. Dynamic Memory Allocation and Linked List', async () => {
  const code = `
    #include <stdio.h>
    #include <stdlib.h>
    struct Node {
      int data;
      struct Node* next;
    };
    int main() {
      struct Node* head = (struct Node*)malloc(sizeof(struct Node));
      head->data = 10;
      head->next = (struct Node*)malloc(sizeof(struct Node));
      head->next->data = 20;
      head->next->next = NULL;

      struct Node* curr = head;
      while (curr) {
        printf("%d -> ", curr->data);
        struct Node* tmp = curr;
        curr = curr->next;
        free(tmp);
      }
      printf("NULL\\n");
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, true);
  assert.match(result.stdout, /10 -> 20 -> NULL/);
});

test('5. Compilation Error Diagnostics', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      this_is_an_invalid_c_syntax;;;
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, false);
  assert.equal(result.phase, 'compilation');
  assert.ok(result.error.length > 0);
});

test('6. Infinite Loop Timeout Guard', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      while(1) {
        // infinite loop
      }
      return 0;
    }
  `;
  const result = await executeCProgram({ code, timeoutMs: 1500 });
  assert.equal(result.success, false);
  assert.match(result.error, /Time Limit Exceeded/);
});
