import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeCProgram } from '../compiler-service/src/executor.js';

test('Compiler Test 1: Infix to Postfix DSA Evaluation', async () => {
  const code = `
    #include <stdio.h>
    #include <ctype.h>

    char stack[100];
    int top = -1;

    void push(char x) { stack[++top] = x; }
    char pop() { return (top == -1) ? -1 : stack[top--]; }
    int priority(char x) {
      if (x == '(') return 0;
      if (x == '+' || x == '-') return 1;
      if (x == '*' || x == '/') return 2;
      return 0;
    }

    int main() {
      char exp[] = "a+b*(c^d-e)^(f+g*h)-i";
      printf("POSTFIX_OK\\n");
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, true);
  assert.match(result.stdout, /POSTFIX_OK/);
});

test('Compiler Test 2: Circular Queue Implementation', async () => {
  const code = `
    #include <stdio.h>
    #define SIZE 5

    int items[SIZE];
    int front = -1, rear = -1;

    int isFull() {
      if ((front == rear + 1) || (front == 0 && rear == SIZE - 1)) return 1;
      return 0;
    }

    void enQueue(int element) {
      if (isFull()) return;
      if (front == -1) front = 0;
      rear = (rear + 1) % SIZE;
      items[rear] = element;
    }

    int main() {
      enQueue(10);
      enQueue(20);
      enQueue(30);
      printf("CIRCULAR_QUEUE_READY: front=%d, rear=%d\\n", front, rear);
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, true);
  assert.match(result.stdout, /CIRCULAR_QUEUE_READY: front=0, rear=2/);
});

test('Compiler Test 3: Binary Search Tree Insertion and In-Order Traversal', async () => {
  const code = `
    #include <stdio.h>
    #include <stdlib.h>

    struct node {
      int key;
      struct node *left, *right;
    };

    struct node* newNode(int item) {
      struct node* temp = (struct node*)malloc(sizeof(struct node));
      temp->key = item;
      temp->left = temp->right = NULL;
      return temp;
    }

    struct node* insert(struct node* node, int key) {
      if (node == NULL) return newNode(key);
      if (key < node->key) node->left = insert(node->left, key);
      else if (key > node->key) node->right = insert(node->right, key);
      return node;
    }

    void inorder(struct node* root) {
      if (root != NULL) {
        inorder(root->left);
        printf("%d ", root->key);
        inorder(root->right);
      }
    }

    int main() {
      struct node* root = NULL;
      root = insert(root, 50);
      insert(root, 30);
      insert(root, 20);
      insert(root, 40);
      insert(root, 70);

      printf("BST_INORDER: ");
      inorder(root);
      printf("\\n");
      return 0;
    }
  `;
  const result = await executeCProgram({ code });
  assert.equal(result.success, true);
  assert.match(result.stdout, /BST_INORDER: 20 30 40 50 70/);
});

test('Compiler Test 4: Multiple scanf inputs parsing', async () => {
  const code = `
    #include <stdio.h>

    int main() {
      int count;
      if (scanf("%d", &count) != 1) return 1;
      int sum = 0;
      for (int i = 0; i < count; i++) {
        int val;
        scanf("%d", &val);
        sum += val;
      }
      printf("TOTAL_SUM: %d\\n", sum);
      return 0;
    }
  `;
  const result = await executeCProgram({ code, stdin: '4 10 20 30 40' });
  assert.equal(result.success, true);
  assert.match(result.stdout, /TOTAL_SUM: 100/);
});

test('Compiler Test 5: Infinite loop timeout protection', async () => {
  const code = `
    #include <stdio.h>
    int main() {
      while (1) {}
      return 0;
    }
  `;
  const result = await executeCProgram({ code, timeoutMs: 1200 });
  assert.equal(result.success, false);
  assert.match(result.error, /Time Limit Exceeded/);
});
