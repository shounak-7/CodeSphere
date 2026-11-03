// CodeSphere Comprehensive DSA Learning Library Data
// Curated specifically for University C & DSA Lab Practical Examinations

export interface DSALibraryProgram {
  id: string;
  title: string;
  filename: string;
  topic: string;
  topicId: string;
  subtopic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  operations: string[];
  timeComplexity: string;
  spaceComplexity: string;
  summary: string;
  explanation: string;
  functions: {
    name: string;
    signature: string;
    description: string;
  }[];
  sampleInputOutput: string;
  code: string;
}

export interface DSATopic {
  id: string;
  name: string;
  category: "Data Structures" | "Algorithms" | "Core Concepts";
  description: string;
  iconName: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    gradient: string;
  };
}

export const DSA_TOPICS: DSATopic[] = [
  {
    id: "arrays",
    name: "Arrays",
    category: "Data Structures",
    description: "Linear contiguous memory collections, sequential storage, element traversal, and multi-element operations.",
    iconName: "LayoutGrid",
    colorScheme: {
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      border: "border-blue-500/20 dark:border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
      gradient: "from-blue-600 to-indigo-600",
    },
  },
  {
    id: "stacks",
    name: "Stacks",
    category: "Data Structures",
    description: "LIFO (Last-In-First-Out) execution stacks, expression parsing, and parenthesis evaluation.",
    iconName: "Layers",
    colorScheme: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      text: "text-indigo-600 dark:text-indigo-400",
      badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      gradient: "from-indigo-600 to-violet-600",
    },
  },
  {
    id: "queues",
    name: "Queues & Circular Queues",
    category: "Data Structures",
    description: "FIFO sequential buffers and circular ring buffers with modular arithmetic.",
    iconName: "ListOrdered",
    colorScheme: {
      bg: "bg-violet-500/10 dark:bg-violet-500/15",
      border: "border-violet-500/20 dark:border-violet-500/30",
      text: "text-violet-600 dark:text-violet-400",
      badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
      gradient: "from-violet-600 to-purple-600",
    },
  },
  {
    id: "linked-lists",
    name: "Linked Lists",
    category: "Data Structures",
    description: "Dynamic node chains: Singly, Doubly (bidirectional), and Circular linked list architectures.",
    iconName: "GitCommit",
    colorScheme: {
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/20 dark:border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      gradient: "from-emerald-600 to-teal-600",
    },
  },
  {
    id: "trees",
    name: "Trees (BST & AVL)",
    category: "Data Structures",
    description: "Hierarchical data structures, Binary Search Trees, and self-balancing AVL trees with rotations.",
    iconName: "Network",
    colorScheme: {
      bg: "bg-teal-500/10 dark:bg-teal-500/15",
      border: "border-teal-500/20 dark:border-teal-500/30",
      text: "text-teal-600 dark:text-teal-400",
      badge: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
      gradient: "from-teal-600 to-cyan-600",
    },
  },
  {
    id: "graphs",
    name: "Graphs (BFS & DFS)",
    category: "Data Structures",
    description: "Adjacency matrices, Breadth-First Search, Depth-First Search, and Dijkstra shortest paths.",
    iconName: "Share2",
    colorScheme: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      border: "border-amber-500/20 dark:border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      gradient: "from-amber-600 to-orange-600",
    },
  },
  {
    id: "sorting",
    name: "Sorting Algorithms",
    category: "Algorithms",
    description: "Comparison and divide-and-conquer sorting: Bubble, Selection, Insertion, Merge, and Quick Sort.",
    iconName: "ArrowDownAZ",
    colorScheme: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      border: "border-rose-500/20 dark:border-rose-500/30",
      text: "text-rose-600 dark:text-rose-400",
      badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      gradient: "from-rose-600 to-pink-600",
    },
  },
  {
    id: "searching",
    name: "Searching Algorithms",
    category: "Algorithms",
    description: "Sequential and logarithmic lookup: Linear Search and iterative/recursive Binary Search.",
    iconName: "Search",
    colorScheme: {
      bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
      border: "border-cyan-500/20 dark:border-cyan-500/30",
      text: "text-cyan-600 dark:text-cyan-400",
      badge: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
      gradient: "from-cyan-600 to-blue-600",
    },
  },
  {
    id: "hashing",
    name: "Hashing",
    category: "Data Structures",
    description: "Hash tables, direct addressing, hash functions, and collision resolution via Linear Probing.",
    iconName: "Hash",
    colorScheme: {
      bg: "bg-orange-500/10 dark:bg-orange-500/15",
      border: "border-orange-500/20 dark:border-orange-500/30",
      text: "text-orange-600 dark:text-orange-400",
      badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
      gradient: "from-orange-600 to-red-600",
    },
  },
  {
    id: "recursion",
    name: "Recursion",
    category: "Core Concepts",
    description: "Self-referencing function calls, base condition mechanics, and Tower of Hanoi step tracing.",
    iconName: "Repeat",
    colorScheme: {
      bg: "bg-purple-500/10 dark:bg-purple-500/15",
      border: "border-purple-500/20 dark:border-purple-500/30",
      text: "text-purple-600 dark:text-purple-400",
      badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
      gradient: "from-purple-600 to-indigo-600",
    },
  },
  {
    id: "strings",
    name: "Strings",
    category: "Core Concepts",
    description: "Char arrays, string length, reversal, palindrome check, concatenation, and substring search.",
    iconName: "Type",
    colorScheme: {
      bg: "bg-pink-500/10 dark:bg-pink-500/15",
      border: "border-pink-500/20 dark:border-pink-500/30",
      text: "text-pink-600 dark:text-pink-400",
      badge: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
      gradient: "from-pink-600 to-rose-600",
    },
  },
  {
    id: "matrix",
    name: "Matrix Operations",
    category: "Data Structures",
    description: "2D multidimensional arrays: row/column indexing, matrix addition, transpose, and multiplication.",
    iconName: "Table",
    colorScheme: {
      bg: "bg-sky-500/10 dark:bg-sky-500/15",
      border: "border-sky-500/20 dark:border-sky-500/30",
      text: "text-sky-600 dark:text-sky-400",
      badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      gradient: "from-sky-600 to-blue-600",
    },
  },
  {
    id: "dma",
    name: "Dynamic Memory (DMA)",
    category: "Core Concepts",
    description: "Heap allocation, runtime memory sizing with malloc, calloc, realloc, and memory safety with free.",
    iconName: "Cpu",
    colorScheme: {
      bg: "bg-slate-500/10 dark:bg-slate-500/15",
      border: "border-slate-500/20 dark:border-slate-500/30",
      text: "text-slate-600 dark:text-slate-400",
      badge: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
      gradient: "from-slate-600 to-zinc-600",
    },
  },
];

export const DSA_LIBRARY: DSALibraryProgram[] = [
  {
    "id": "arrays-crud-operations",
    "title": "Array Operations: Insertion, Deletion, Search & Merge",
    "filename": "array_operations.c",
    "topic": "Arrays",
    "topicId": "arrays",
    "subtopic": "Linear Arrays",
    "difficulty": "Beginner",
    "operations": [
      "Insertion at Index",
      "Deletion at Index",
      "Linear Search",
      "Binary Search",
      "Array Merging",
      "Display"
    ],
    "timeComplexity": "Insert: O(n), Delete: O(n), Search: O(n) / O(log n), Merge: O(m+n)",
    "spaceComplexity": "O(1) auxiliary",
    "summary": "Comprehensive array implementation providing boundary-checked insertion, element removal with left-shifting, searching routines, and merging two sorted arrays.",
    "explanation": "Arrays in C are contiguous blocks of memory. Inserting at position k requires shifting all subsequent elements right by 1 index to prevent overwriting. Deletion requires left-shifting elements to overwrite the removed item and decrementing the size counter. Binary search requires elements to be in sorted order and halves the search space each step.",
    "functions": [
      {
        "name": "insertElement",
        "signature": "int insertElement(int arr[], int *n, int capacity, int element, int pos)",
        "description": "Shifts elements right from pos to n-1, inserts element at pos, and increments size."
      },
      {
        "name": "deleteElement",
        "signature": "int deleteElement(int arr[], int *n, int pos)",
        "description": "Removes element at pos by shifting elements left and decrements size counter."
      },
      {
        "name": "linearSearch",
        "signature": "int linearSearch(int arr[], int n, int key)",
        "description": "Iterates sequentially through array; returns matching index or -1."
      },
      {
        "name": "binarySearch",
        "signature": "int binarySearch(int arr[], int n, int key)",
        "description": "Iterative binary search on sorted array; returns index or -1."
      },
      {
        "name": "mergeArrays",
        "signature": "void mergeArrays(int a[], int n1, int b[], int n2, int res[])",
        "description": "Merges two sorted arrays into a single combined array in linear time."
      },
      {
        "name": "displayArray",
        "signature": "void displayArray(int arr[], int n)",
        "description": "Prints array contents in a formatted bracket notation."
      }
    ],
    "sampleInputOutput": "Sample Run:\n1. Enter array size (e.g. 5) and elements: 10 20 30 40 50\n2. Choose Option 1 (Insert): Element = 25, Position = 2\n   Result: [10, 20, 25, 30, 40, 50]\n3. Choose Option 2 (Delete): Position = 3\n   Result: [10, 20, 25, 40, 50]\n4. Choose Option 4 (Binary Search): Key = 40\n   Result: Element 40 found at index 3",
    "code": "#include <stdio.h>\n#define MAX_SIZE 100\n\n// Function prototypes\nvoid displayArray(const int arr[], int n);\nint insertElement(int arr[], int *n, int capacity, int element, int pos);\nint deleteElement(int arr[], int *n, int pos);\nint linearSearch(const int arr[], int n, int key);\nint binarySearch(const int arr[], int n, int key);\nvoid mergeArrays(const int a[], int n1, const int b[], int n2, int res[]);\n\nvoid displayArray(const int arr[], int n) {\n    if (n == 0) {\n        printf(\"Array is empty.\\n\");\n        return;\n    }\n    printf(\"Array elements (%d): [ \", n);\n    for (int i = 0; i < n; i++) {\n        printf(\"%d%s\", arr[i], (i == n - 1) ? \"\" : \", \");\n    }\n    printf(\" ]\\n\");\n}\n\nint insertElement(int arr[], int *n, int capacity, int element, int pos) {\n    if (*n >= capacity) {\n        printf(\"Error: Array overflow. Maximum capacity reached.\\n\");\n        return 0;\n    }\n    if (pos < 0 || pos > *n) {\n        printf(\"Error: Invalid position. Valid range: 0 to %d.\\n\", *n);\n        return 0;\n    }\n    // Shift elements to the right\n    for (int i = *n; i > pos; i--) {\n        arr[i] = arr[i - 1];\n    }\n    arr[pos] = element;\n    (*n)++;\n    return 1;\n}\n\nint deleteElement(int arr[], int *n, int pos) {\n    if (*n <= 0) {\n        printf(\"Error: Array underflow. Array is already empty.\\n\");\n        return 0;\n    }\n    if (pos < 0 || pos >= *n) {\n        printf(\"Error: Invalid position. Valid range: 0 to %d.\\n\", *n - 1);\n        return 0;\n    }\n    int removed = arr[pos];\n    // Shift elements to the left\n    for (int i = pos; i < *n - 1; i++) {\n        arr[i] = arr[i + 1];\n    }\n    (*n)--;\n    printf(\"Successfully deleted element %d from index %d.\\n\", removed, pos);\n    return 1;\n}\n\nint linearSearch(const int arr[], int n, int key) {\n    for (int i = 0; i < n; i++) {\n        if (arr[i] == key) return i;\n    }\n    return -1;\n}\n\nint binarySearch(const int arr[], int n, int key) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == key) return mid;\n        else if (arr[mid] < key) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n\nvoid mergeArrays(const int a[], int n1, const int b[], int n2, int res[]) {\n    int i = 0, j = 0, k = 0;\n    while (i < n1 && j < n2) {\n        if (a[i] <= b[j]) res[k++] = a[i++];\n        else res[k++] = b[j++];\n    }\n    while (i < n1) res[k++] = a[i++];\n    while (j < n2) res[k++] = b[j++];\n}\n\nint main() {\n    int arr[MAX_SIZE];\n    int n = 0, choice, val, pos, key, res;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Array Operations     \\n\");\n    printf(\"===========================================\\n\");\n    printf(\"Enter initial number of elements: \");\n    if (scanf(\"%d\", &n) != 1 || n < 0 || n > MAX_SIZE) n = 0;\n\n    if (n > 0) {\n        printf(\"Enter %d integers: \", n);\n        for (int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    }\n\n    do {\n        printf(\"\\n--- Menu ---\\n\");\n        printf(\"1. Insert Element\\n\");\n        printf(\"2. Delete Element\\n\");\n        printf(\"3. Linear Search\\n\");\n        printf(\"4. Binary Search\\n\");\n        printf(\"5. Display Array\\n\");\n        printf(\"6. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter value to insert: \");\n                scanf(\"%d\", &val);\n                printf(\"Enter position (0 to %d): \", n);\n                scanf(\"%d\", &pos);\n                if (insertElement(arr, &n, MAX_SIZE, val, pos)) {\n                    printf(\"Element %d inserted successfully.\\n\", val);\n                    displayArray(arr, n);\n                }\n                break;\n            case 2:\n                printf(\"Enter position to delete (0 to %d): \", n - 1);\n                scanf(\"%d\", &pos);\n                if (deleteElement(arr, &n, pos)) {\n                    displayArray(arr, n);\n                }\n                break;\n            case 3:\n                printf(\"Enter key to search (Linear): \");\n                scanf(\"%d\", &key);\n                res = linearSearch(arr, n, key);\n                if (res != -1) printf(\"Found %d at index %d.\\n\", key, res);\n                else printf(\"Element %d not found.\\n\", key);\n                break;\n            case 4:\n                printf(\"Enter key to search (Binary - Array must be sorted): \");\n                scanf(\"%d\", &key);\n                res = binarySearch(arr, n, key);\n                if (res != -1) printf(\"Found %d at index %d.\\n\", key, res);\n                else printf(\"Element %d not found (ensure array is sorted).\\n\", key);\n                break;\n            case 5:\n                displayArray(arr, n);\n                break;\n            case 6:\n                printf(\"Exiting array program. Happy coding!\\n\");\n                break;\n            default:\n                printf(\"Invalid choice! Please select 1-6.\\n\");\n        }\n    } while (choice != 6);\n\n    return 0;\n}"
  },
  {
    "id": "matrix-2d-array-operations",
    "title": "2D Matrix: Addition, Transpose & Multiplication",
    "filename": "matrix_operations.c",
    "topic": "Arrays",
    "topicId": "arrays",
    "subtopic": "2D Arrays / Matrices",
    "difficulty": "Beginner",
    "operations": [
      "Matrix Input",
      "Matrix Display",
      "Matrix Addition",
      "Matrix Transpose",
      "Matrix Multiplication"
    ],
    "timeComplexity": "Addition/Transpose: O(r * c), Multiplication: O(r1 * c1 * c2)",
    "spaceComplexity": "O(r * c) auxiliary",
    "summary": "Implements standard 2D matrix manipulation routines including dimension compatibility checking, dynamic arithmetic, and in-place or auxiliary transpose.",
    "explanation": "Two matrices can be multiplied only if the number of columns in the first matrix equals the number of rows in the second matrix. The dot product of row i from matrix A and column j from matrix B forms cell (i, j) of the product matrix.",
    "functions": [
      {
        "name": "readMatrix",
        "signature": "void readMatrix(int r, int c, int mat[r][c], const char* name)",
        "description": "Prompts the user and reads elements for an r x c matrix."
      },
      {
        "name": "printMatrix",
        "signature": "void printMatrix(int r, int c, int mat[r][c], const char* name)",
        "description": "Prints a formatted 2D table representing the matrix."
      },
      {
        "name": "addMatrices",
        "signature": "void addMatrices(int r, int c, int a[r][c], int b[r][c], int res[r][c])",
        "description": "Calculates element-wise addition res[i][j] = a[i][j] + b[i][j]."
      },
      {
        "name": "transposeMatrix",
        "signature": "void transposeMatrix(int r, int c, int mat[r][c], int trans[c][r])",
        "description": "Swaps rows with columns such that trans[j][i] = mat[i][j]."
      },
      {
        "name": "multiplyMatrices",
        "signature": "void multiplyMatrices(int r1, int c1, int a[r1][c1], int r2, int c2, int b[r2][c2], int res[r1][c2])",
        "description": "Performs standard matrix multiplication using triple nested loop."
      }
    ],
    "sampleInputOutput": "Sample Run:\nMatrix A (2x2):\n[ 1  2 ]\n[ 3  4 ]\nMatrix B (2x2):\n[ 5  6 ]\n[ 7  8 ]\nMultiplication Result A * B (2x2):\n[ 19  22 ]\n[ 43  50 ]",
    "code": "#include <stdio.h>\n\n#define MAX 10\n\nvoid readMatrix(int mat[MAX][MAX], int r, int c, const char* name) {\n    printf(\"Enter elements for Matrix %s (%d x %d):\\n\", name, r, c);\n    for (int i = 0; i < r; i++) {\n        for (int j = 0; j < c; j++) {\n            printf(\"%s[%d][%d]: \", name, i, j);\n            scanf(\"%d\", &mat[i][j]);\n        }\n    }\n}\n\nvoid printMatrix(const int mat[MAX][MAX], int r, int c, const char* name) {\n    printf(\"\\n--- Matrix %s (%d x %d) ---\\n\", name, r, c);\n    for (int i = 0; i < r; i++) {\n        printf(\"| \");\n        for (int j = 0; j < c; j++) {\n            printf(\"%4d \", mat[i][j]);\n        }\n        printf(\"|\\n\");\n    }\n}\n\nvoid addMatrices(const int a[MAX][MAX], const int b[MAX][MAX], int res[MAX][MAX], int r, int c) {\n    for (int i = 0; i < r; i++) {\n        for (int j = 0; j < c; j++) {\n            res[i][j] = a[i][j] + b[i][j];\n        }\n    }\n}\n\nvoid transposeMatrix(const int mat[MAX][MAX], int trans[MAX][MAX], int r, int c) {\n    for (int i = 0; i < r; i++) {\n        for (int j = 0; j < c; j++) {\n            trans[j][i] = mat[i][j];\n        }\n    }\n}\n\nvoid multiplyMatrices(const int a[MAX][MAX], int r1, int c1,\n                      const int b[MAX][MAX], int r2, int c2,\n                      int res[MAX][MAX]) {\n    for (int i = 0; i < r1; i++) {\n        for (int j = 0; j < c2; j++) {\n            res[i][j] = 0;\n            for (int k = 0; k < c1; k++) {\n                res[i][j] += a[i][k] * b[k][j];\n            }\n        }\n    }\n}\n\nint main() {\n    int A[MAX][MAX], B[MAX][MAX], C[MAX][MAX];\n    int r1, c1, r2, c2, choice;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Matrix Operations    \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter rows and columns for Matrix A: \");\n    scanf(\"%d %d\", &r1, &c1);\n    readMatrix(A, r1, c1, \"A\");\n\n    printf(\"Enter rows and columns for Matrix B: \");\n    scanf(\"%d %d\", &r2, &c2);\n    readMatrix(B, r2, c2, \"B\");\n\n    printMatrix(A, r1, c1, \"A\");\n    printMatrix(B, r2, c2, \"B\");\n\n    do {\n        printf(\"\\n--- Matrix Menu ---\\n\");\n        printf(\"1. Matrix Addition (A + B)\\n\");\n        printf(\"2. Matrix Multiplication (A * B)\\n\");\n        printf(\"3. Transpose of Matrix A\\n\");\n        printf(\"4. Transpose of Matrix B\\n\");\n        printf(\"5. Exit\\n\");\n        printf(\"Enter your choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                if (r1 == r2 && c1 == c2) {\n                    addMatrices(A, B, C, r1, c1);\n                    printMatrix(C, r1, c1, \"A + B\");\n                } else {\n                    printf(\"Error: Matrices must have matching dimensions for addition!\\n\");\n                }\n                break;\n            case 2:\n                if (c1 == r2) {\n                    multiplyMatrices(A, r1, c1, B, r2, c2, C);\n                    printMatrix(C, r1, c2, \"A * B\");\n                } else {\n                    printf(\"Error: Columns of A (%d) must equal Rows of B (%d) for multiplication!\\n\", c1, r2);\n                }\n                break;\n            case 3:\n                transposeMatrix(A, C, r1, c1);\n                printMatrix(C, c1, r1, \"Transpose(A)\");\n                break;\n            case 4:\n                transposeMatrix(B, C, r2, c2);\n                printMatrix(C, c2, r2, \"Transpose(B)\");\n                break;\n            case 5:\n                printf(\"Exiting matrix operations.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection!\\n\");\n        }\n    } while (choice != 5);\n\n    return 0;\n}"
  },
  {
    "id": "stack-array-implementation",
    "title": "Stack Implementation using Array (LIFO)",
    "filename": "stack_array.c",
    "topic": "Stacks",
    "topicId": "stacks",
    "subtopic": "Stack Data Structure",
    "difficulty": "Beginner",
    "operations": [
      "Push",
      "Pop",
      "Peek",
      "IsEmpty",
      "IsFull",
      "Display"
    ],
    "timeComplexity": "Push: O(1), Pop: O(1), Peek: O(1), Display: O(n)",
    "spaceComplexity": "O(n) fixed array",
    "summary": "Complete menu-driven implementation of Last-In-First-Out (LIFO) Stack data structure using an array with top index tracker.",
    "explanation": "A Stack restricts insertion and deletion to one end called 'top'. A push operation increments top and places the item. A pop operation retrieves the item at top and decrements top. Overflow occurs if push is invoked when top == MAX - 1; underflow occurs if pop is invoked when top == -1.",
    "functions": [
      {
        "name": "push",
        "signature": "int push(Stack *s, int val)",
        "description": "Checks for overflow; if space exists, increments top and places val."
      },
      {
        "name": "pop",
        "signature": "int pop(Stack *s, int *poppedVal)",
        "description": "Checks for underflow; copies top item, decrements top, and returns 1."
      },
      {
        "name": "peek",
        "signature": "int peek(const Stack *s, int *topVal)",
        "description": "Inspects top element without removing it."
      },
      {
        "name": "isEmpty",
        "signature": "int isEmpty(const Stack *s)",
        "description": "Returns 1 if top == -1, else 0."
      },
      {
        "name": "isFull",
        "signature": "int isFull(const Stack *s)",
        "description": "Returns 1 if top == MAX - 1, else 0."
      },
      {
        "name": "display",
        "signature": "void display(const Stack *s)",
        "description": "Prints stack elements from top to bottom."
      }
    ],
    "sampleInputOutput": "Sample Run:\n1. Push 10, Push 20, Push 30\n   Stack: [30 (top), 20, 10]\n2. Peek: Top item is 30\n3. Pop: Successfully popped 30\n   Stack: [20 (top), 10]",
    "code": "#include <stdio.h>\n#define MAX 5\n\ntypedef struct {\n    int data[MAX];\n    int top;\n} Stack;\n\nvoid initStack(Stack *s) {\n    s->top = -1;\n}\n\nint isFull(const Stack *s) {\n    return s->top == MAX - 1;\n}\n\nint isEmpty(const Stack *s) {\n    return s->top == -1;\n}\n\nint push(Stack *s, int val) {\n    if (isFull(s)) {\n        printf(\"Stack Overflow! Cannot push %d (Max capacity: %d)\\n\", val, MAX);\n        return 0;\n    }\n    s->data[++(s->top)] = val;\n    printf(\"Pushed %d onto stack.\\n\", val);\n    return 1;\n}\n\nint pop(Stack *s, int *poppedVal) {\n    if (isEmpty(s)) {\n        printf(\"Stack Underflow! Stack is completely empty.\\n\");\n        return 0;\n    }\n    *poppedVal = s->data[(s->top)--];\n    return 1;\n}\n\nint peek(const Stack *s, int *topVal) {\n    if (isEmpty(s)) {\n        printf(\"Stack is empty, no element to peek.\\n\");\n        return 0;\n    }\n    *topVal = s->data[s->top];\n    return 1;\n}\n\nvoid display(const Stack *s) {\n    if (isEmpty(s)) {\n        printf(\"Stack is empty [ ]\\n\");\n        return;\n    }\n    printf(\"\\nCurrent Stack (top to bottom):\\n\");\n    for (int i = s->top; i >= 0; i--) {\n        printf(\" | %4d | %s\\n\", s->data[i], (i == s->top) ? \"<-- TOP\" : \"\");\n    }\n    printf(\" +------+\\n\");\n}\n\nint main() {\n    Stack s;\n    initStack(&s);\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Array Stack (LIFO)   \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Stack Menu ---\\n\");\n        printf(\"1. Push\\n\");\n        printf(\"2. Pop\\n\");\n        printf(\"3. Peek (Top Item)\\n\");\n        printf(\"4. Display Stack\\n\");\n        printf(\"5. Check Empty / Full\\n\");\n        printf(\"6. Exit\\n\");\n        printf(\"Enter your choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter integer value to push: \");\n                scanf(\"%d\", &val);\n                push(&s, val);\n                display(&s);\n                break;\n            case 2:\n                if (pop(&s, &val)) {\n                    printf(\"Popped value: %d\\n\", val);\n                    display(&s);\n                }\n                break;\n            case 3:\n                if (peek(&s, &val)) {\n                    printf(\"Top element is: %d\\n\", val);\n                }\n                break;\n            case 4:\n                display(&s);\n                break;\n            case 5:\n                printf(\"Stack is %s and %s.\\n\",\n                       isEmpty(&s) ? \"EMPTY\" : \"NOT empty\",\n                       isFull(&s) ? \"FULL\" : \"NOT full\");\n                break;\n            case 6:\n                printf(\"Exiting stack program.\\n\");\n                break;\n            default:\n                printf(\"Invalid choice! Choose 1-6.\\n\");\n        }\n    } while (choice != 6);\n\n    return 0;\n}"
  },
  {
    "id": "infix-to-postfix-evaluation",
    "title": "Infix to Postfix Conversion & Postfix Evaluation",
    "filename": "infix_to_postfix.c",
    "topic": "Stacks",
    "topicId": "stacks",
    "subtopic": "Stack Applications",
    "difficulty": "Intermediate",
    "operations": [
      "Operator Precedence Check",
      "Infix to Postfix Conversion",
      "Postfix Expression Evaluation"
    ],
    "timeComplexity": "Conversion: O(n), Evaluation: O(n)",
    "spaceComplexity": "O(n) auxiliary stack",
    "summary": "Classical compiler/evaluator application of Stack to convert standard arithmetic infix expressions to Reverse Polish Notation (Postfix) and evaluate the numerical result.",
    "explanation": "Infix expressions like (A + B * C) have implicit operator precedence. Postfix expressions like A B C * + are unambiguous and do not require parentheses. Operators are pushed onto a stack based on precedence; operands are directly appended to the output string.",
    "functions": [
      {
        "name": "precedence",
        "signature": "int precedence(char op)",
        "description": "Returns operator precedence (+,-: 1; *,/: 2; ^: 3)."
      },
      {
        "name": "isOperator",
        "signature": "int isOperator(char ch)",
        "description": "Checks if a character is one of +, -, *, /, ^."
      },
      {
        "name": "infixToPostfix",
        "signature": "void infixToPostfix(const char *infix, char *postfix)",
        "description": "Converts valid infix string into postfix using operator stack."
      },
      {
        "name": "evaluatePostfix",
        "signature": "int evaluatePostfix(const char *postfix)",
        "description": "Computes final integer value by pushing operands and applying operators."
      }
    ],
    "sampleInputOutput": "Sample Run:\nEnter Infix Expression: 5 + 3 * 2\nPostfix Notation: 5 3 2 * +\nEvaluated Result: 11 (Since 3 * 2 = 6, 5 + 6 = 11)",
    "code": "#include <stdio.h>\n#include <ctype.h>\n#include <string.h>\n#include <math.h>\n\n#define MAX 100\n\n// Character stack for conversion\ntypedef struct {\n    char data[MAX];\n    int top;\n} CharStack;\n\n// Integer stack for evaluation\ntypedef struct {\n    int data[MAX];\n    int top;\n} IntStack;\n\nvoid pushChar(CharStack *s, char c) { s->data[++(s->top)] = c; }\nchar popChar(CharStack *s) { return s->data[(s->top)--]; }\nchar peekChar(const CharStack *s) { return s->data[s->top]; }\nint isCharEmpty(const CharStack *s) { return s->top == -1; }\n\nvoid pushInt(IntStack *s, int val) { s->data[++(s->top)] = val; }\nint popInt(IntStack *s) { return s->data[(s->top)--]; }\n\nint precedence(char op) {\n    switch (op) {\n        case '+':\n        case '-': return 1;\n        case '*':\n        case '/': return 2;\n        case '^': return 3;\n        default: return 0;\n    }\n}\n\nint isOperator(char ch) {\n    return (ch == '+' || ch == '-' || ch == '*' || ch == '/' || ch == '^');\n}\n\nvoid infixToPostfix(const char *infix, char *postfix) {\n    CharStack s;\n    s.top = -1;\n    int k = 0;\n\n    for (int i = 0; infix[i] != '\\0'; i++) {\n        char ch = infix[i];\n\n        if (isspace(ch)) continue;\n\n        // If operand, add to postfix\n        if (isalnum(ch)) {\n            postfix[k++] = ch;\n        } else if (ch == '(') {\n            pushChar(&s, ch);\n        } else if (ch == ')') {\n            while (!isCharEmpty(&s) && peekChar(&s) != '(') {\n                postfix[k++] = popChar(&s);\n            }\n            if (!isCharEmpty(&s) && peekChar(&s) == '(') {\n                popChar(&s); // remove '('\n            }\n        } else if (isOperator(ch)) {\n            while (!isCharEmpty(&s) && precedence(peekChar(&s)) >= precedence(ch)) {\n                postfix[k++] = popChar(&s);\n            }\n            pushChar(&s, ch);\n        }\n    }\n\n    while (!isCharEmpty(&s)) {\n        postfix[k++] = popChar(&s);\n    }\n    postfix[k] = '\\0';\n}\n\nint evaluatePostfix(const char *postfix) {\n    IntStack s;\n    s.top = -1;\n\n    for (int i = 0; postfix[i] != '\\0'; i++) {\n        char ch = postfix[i];\n\n        if (isdigit(ch)) {\n            pushInt(&s, ch - '0');\n        } else if (isOperator(ch)) {\n            int val2 = popInt(&s);\n            int val1 = popInt(&s);\n            switch (ch) {\n                case '+': pushInt(&s, val1 + val2); break;\n                case '-': pushInt(&s, val1 - val2); break;\n                case '*': pushInt(&s, val1 * val2); break;\n                case '/': pushInt(&s, val1 / val2); break;\n                case '^': pushInt(&s, (int)pow(val1, val2)); break;\n            }\n        }\n    }\n    return popInt(&s);\n}\n\nint main() {\n    char infix[MAX];\n    char postfix[MAX];\n\n    printf(\"===========================================\\n\");\n    printf(\"  Infix to Postfix & Expression Evaluator  \\n\");\n    printf(\"===========================================\\n\");\n    printf(\"Enter Infix expression (e.g. (2+3)*4 or 5+2*3): \");\n    if (fgets(infix, sizeof(infix), stdin)) {\n        infix[strcspn(infix, \"\\n\")] = 0; // Strip newline\n    }\n\n    infixToPostfix(infix, postfix);\n    printf(\"\\nInfix Expression  : %s\\n\", infix);\n    printf(\"Postfix Expression: %s\\n\", postfix);\n\n    // If digits only, evaluate\n    int canEvaluate = 1;\n    for (int i = 0; postfix[i] != '\\0'; i++) {\n        if (isalpha(postfix[i])) {\n            canEvaluate = 0;\n            break;\n        }\n    }\n\n    if (canEvaluate && strlen(postfix) > 0) {\n        int result = evaluatePostfix(postfix);\n        printf(\"Evaluated Result  : %d\\n\", result);\n    } else {\n        printf(\"Note: Numerical evaluation skipped because expression contains letters.\\n\");\n    }\n\n    return 0;\n}"
  },
  {
    "id": "queue-linear-array",
    "title": "Linear Queue Implementation using Array (FIFO)",
    "filename": "queue_array.c",
    "topic": "Queues & Circular Queues",
    "topicId": "queues",
    "subtopic": "Linear Queue",
    "difficulty": "Beginner",
    "operations": [
      "Enqueue",
      "Dequeue",
      "Front",
      "IsEmpty",
      "IsFull",
      "Display"
    ],
    "timeComplexity": "Enqueue: O(1), Dequeue: O(1), Front: O(1), Display: O(n)",
    "spaceComplexity": "O(n) array",
    "summary": "Implements First-In-First-Out (FIFO) queue with front and rear pointers, showing enqueue at rear and dequeue at front.",
    "explanation": "A Linear Queue follows FIFO discipline. Elements are added at the rear and removed from the front. A limitation of a linear array queue is that once rear reaches MAX-1, no new elements can be enqueued even if elements were dequeued from the front (false overflow). Circular queues resolve this.",
    "functions": [
      {
        "name": "enqueue",
        "signature": "int enqueue(Queue *q, int val)",
        "description": "Adds element to rear of queue."
      },
      {
        "name": "dequeue",
        "signature": "int dequeue(Queue *q, int *val)",
        "description": "Removes and returns element from front of queue."
      },
      {
        "name": "getFront",
        "signature": "int getFront(const Queue *q, int *val)",
        "description": "Views front item without removing it."
      },
      {
        "name": "display",
        "signature": "void display(const Queue *q)",
        "description": "Displays all active elements from front to rear."
      }
    ],
    "sampleInputOutput": "Sample Run:\n1. Enqueue 10, Enqueue 20, Enqueue 30\n   Queue: [10 (front), 20, 30 (rear)]\n2. Dequeue: Removed 10\n   Queue: [20 (front), 30 (rear)]",
    "code": "#include <stdio.h>\n#define MAX 5\n\ntypedef struct {\n    int data[MAX];\n    int front;\n    int rear;\n} Queue;\n\nvoid initQueue(Queue *q) {\n    q->front = -1;\n    q->rear = -1;\n}\n\nint isFull(const Queue *q) {\n    return q->rear == MAX - 1;\n}\n\nint isEmpty(const Queue *q) {\n    return q->front == -1 || q->front > q->rear;\n}\n\nint enqueue(Queue *q, int val) {\n    if (isFull(q)) {\n        printf(\"Queue Overflow! Cannot enqueue %d\\n\", val);\n        return 0;\n    }\n    if (q->front == -1) q->front = 0;\n    q->data[++(q->rear)] = val;\n    printf(\"Enqueued %d to rear.\\n\", val);\n    return 1;\n}\n\nint dequeue(Queue *q, int *val) {\n    if (isEmpty(q)) {\n        printf(\"Queue Underflow! Queue is empty.\\n\");\n        return 0;\n    }\n    *val = q->data[(q->front)++];\n    if (q->front > q->rear) { // Reset when empty\n        q->front = -1;\n        q->rear = -1;\n    }\n    return 1;\n}\n\nint getFront(const Queue *q, int *val) {\n    if (isEmpty(q)) {\n        printf(\"Queue is empty.\\n\");\n        return 0;\n    }\n    *val = q->data[q->front];\n    return 1;\n}\n\nvoid display(const Queue *q) {\n    if (isEmpty(q)) {\n        printf(\"Queue is empty [ ]\\n\");\n        return;\n    }\n    printf(\"Queue elements: [ \");\n    for (int i = q->front; i <= q->rear; i++) {\n        printf(\"%d%s\", q->data[i], (i == q->rear) ? \"\" : \", \");\n    }\n    printf(\" ] (Front: %d, Rear: %d)\\n\", q->front, q->rear);\n}\n\nint main() {\n    Queue q;\n    initQueue(&q);\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Linear Queue (FIFO)  \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Linear Queue Menu ---\\n\");\n        printf(\"1. Enqueue\\n\");\n        printf(\"2. Dequeue\\n\");\n        printf(\"3. View Front\\n\");\n        printf(\"4. Display Queue\\n\");\n        printf(\"5. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter value to enqueue: \");\n                scanf(\"%d\", &val);\n                enqueue(&q, val);\n                display(&q);\n                break;\n            case 2:\n                if (dequeue(&q, &val)) {\n                    printf(\"Dequeued value: %d\\n\", val);\n                    display(&q);\n                }\n                break;\n            case 3:\n                if (getFront(&q, &val)) {\n                    printf(\"Front item is: %d\\n\", val);\n                }\n                break;\n            case 4:\n                display(&q);\n                break;\n            case 5:\n                printf(\"Exiting queue.\\n\");\n                break;\n            default:\n                printf(\"Invalid choice! Choose 1-5.\\n\");\n        }\n    } while (choice != 5);\n\n    return 0;\n}"
  },
  {
    "id": "circular-queue-array",
    "title": "Circular Queue Implementation with Modular Arithmetic",
    "filename": "circular_queue.c",
    "topic": "Queues & Circular Queues",
    "topicId": "queues",
    "subtopic": "Circular Queue",
    "difficulty": "Beginner",
    "operations": [
      "Circular Enqueue",
      "Circular Dequeue",
      "Front Peek",
      "Display"
    ],
    "timeComplexity": "Enqueue: O(1), Dequeue: O(1), Display: O(n)",
    "spaceComplexity": "O(n) array with circular wrap-around",
    "summary": "Efficient circular queue overcoming linear queue space wastage by wrapping pointers using (index + 1) % MAX formula.",
    "explanation": "In a circular queue, when rear reaches the last index (MAX - 1), it wraps around to index 0 if positions have opened up due to prior dequeues. Full condition: (rear + 1) % MAX == front. Empty condition: front == -1.",
    "functions": [
      {
        "name": "enqueueCircular",
        "signature": "int enqueueCircular(CircularQueue *q, int val)",
        "description": "Inserts item with wrap-around using (rear + 1) % MAX."
      },
      {
        "name": "dequeueCircular",
        "signature": "int dequeueCircular(CircularQueue *q, int *val)",
        "description": "Deletes item with wrap-around using (front + 1) % MAX."
      },
      {
        "name": "displayCircular",
        "signature": "void displayCircular(const CircularQueue *q)",
        "description": "Traverses circular array from front to rear."
      }
    ],
    "sampleInputOutput": "Sample Run:\n1. Enqueue 10, 20, 30, 40, 50 (Queue full)\n2. Dequeue two items: 10 and 20 are removed\n3. Enqueue 60 and 70: They wrap around to indices 0 and 1!\n   Result: Full memory utilization without false overflow.",
    "code": "#include <stdio.h>\n#define SIZE 5\n\ntypedef struct {\n    int items[SIZE];\n    int front;\n    int rear;\n} CircularQueue;\n\nvoid initCircularQueue(CircularQueue *q) {\n    q->front = -1;\n    q->rear = -1;\n}\n\nint isFull(const CircularQueue *q) {\n    return (q->front == (q->rear + 1) % SIZE);\n}\n\nint isEmpty(const CircularQueue *q) {\n    return q->front == -1;\n}\n\nint enqueueCircular(CircularQueue *q, int val) {\n    if (isFull(q)) {\n        printf(\"Circular Queue Overflow! Cannot insert %d\\n\", val);\n        return 0;\n    }\n    if (q->front == -1) q->front = 0;\n    q->rear = (q->rear + 1) % SIZE;\n    q->items[q->rear] = val;\n    printf(\"Inserted %d at circular index %d.\\n\", val, q->rear);\n    return 1;\n}\n\nint dequeueCircular(CircularQueue *q, int *val) {\n    if (isEmpty(q)) {\n        printf(\"Circular Queue Underflow! Queue is empty.\\n\");\n        return 0;\n    }\n    *val = q->items[q->front];\n    if (q->front == q->rear) { // Reset queue\n        q->front = -1;\n        q->rear = -1;\n    } else {\n        q->front = (q->front + 1) % SIZE;\n    }\n    return 1;\n}\n\nvoid displayCircular(const CircularQueue *q) {\n    if (isEmpty(q)) {\n        printf(\"Circular Queue is empty [ ]\\n\");\n        return;\n    }\n    printf(\"Circular Queue elements: [ \");\n    int i = q->front;\n    while (1) {\n        printf(\"%d\", q->items[i]);\n        if (i == q->rear) break;\n        printf(\", \");\n        i = (i + 1) % SIZE;\n    }\n    printf(\" ] (Front: %d, Rear: %d)\\n\", q->front, q->rear);\n}\n\nint main() {\n    CircularQueue q;\n    initCircularQueue(&q);\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Circular Queue       \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Circular Queue Menu ---\\n\");\n        printf(\"1. Enqueue\\n\");\n        printf(\"2. Dequeue\\n\");\n        printf(\"3. Display Circular Queue\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter value to insert: \");\n                scanf(\"%d\", &val);\n                enqueueCircular(&q, val);\n                displayCircular(&q);\n                break;\n            case 2:\n                if (dequeueCircular(&q, &val)) {\n                    printf(\"Dequeued value: %d\\n\", val);\n                    displayCircular(&q);\n                }\n                break;\n            case 3:\n                displayCircular(&q);\n                break;\n            case 4:\n                printf(\"Exiting circular queue.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection!\\n\");\n        }\n    } while (choice != 4);\n\n    return 0;\n}"
  },
  {
    "id": "singly-linked-list",
    "title": "Singly Linked List: Insertion, Deletion & In-place Reversal",
    "filename": "singly_linked_list.c",
    "topic": "Linked Lists",
    "topicId": "linked-lists",
    "subtopic": "Singly Linked List",
    "difficulty": "Beginner",
    "operations": [
      "Insert at Head",
      "Insert at Tail",
      "Insert at Position",
      "Delete by Value",
      "In-place Reversal",
      "Search",
      "Display"
    ],
    "timeComplexity": "Insert Head: O(1), Insert Tail: O(n), Delete: O(n), Reverse: O(n)",
    "spaceComplexity": "O(1) auxiliary",
    "summary": "Foundational dynamic data structure using self-referential pointer nodes with complete CRUD operations, pointer reversal, and memory deallocation.",
    "explanation": "Each node holds data and a 'next' pointer pointing to the next node in heap memory. In-place reversal uses three pointers (prev, curr, next) to flip pointer directions in a single O(n) pass without allocating extra memory.",
    "functions": [
      {
        "name": "createNode",
        "signature": "Node* createNode(int val)",
        "description": "Allocates memory on the heap and initializes node data and next pointer."
      },
      {
        "name": "insertAtHead",
        "signature": "Node* insertAtHead(Node *head, int val)",
        "description": "Inserts a new element at the start of the list in O(1) time and returns the new head."
      },
      {
        "name": "insertAtTail",
        "signature": "Node* insertAtTail(Node *head, int val)",
        "description": "Traverses to the end of the list and appends a new node in O(n) time, returning head."
      },
      {
        "name": "deleteByValue",
        "signature": "Node* deleteByValue(Node *head, int key)",
        "description": "Locates and unlinks the first node containing the key, frees memory, and returns updated head."
      },
      {
        "name": "reverseList",
        "signature": "Node* reverseList(Node *head)",
        "description": "Reverses node pointers iteratively in O(n) time and O(1) space, returning the new head."
      },
      {
        "name": "displayList",
        "signature": "void displayList(const Node *head)",
        "description": "Traverses the linked list sequentially and prints each node value."
      }
    ],
    "sampleInputOutput": "Sample Run:\n1. Insert at head: 10 -> [10] -> NULL\n2. Insert at tail: 20, 30 -> [10] -> [20] -> [30] -> NULL\n3. Reverse List -> [30] -> [20] -> [10] -> NULL\n4. Delete value 20 -> [30] -> [10] -> NULL",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int data;\n    struct Node *next;\n} Node;\n\nNode* createNode(int val) {\n    Node *newNode = (Node*)malloc(sizeof(Node));\n    if (!newNode) {\n        printf(\"Memory allocation failed!\\n\");\n        exit(1);\n    }\n    newNode->data = val;\n    newNode->next = NULL;\n    return newNode;\n}\n\n// Single pointer: inserts at beginning and returns new head\nNode* insertAtHead(Node *head, int val) {\n    Node *newNode = createNode(val);\n    newNode->next = head;\n    return newNode;\n}\n\n// Single pointer: appends to tail and returns head\nNode* insertAtTail(Node *head, int val) {\n    Node *newNode = createNode(val);\n    if (head == NULL) {\n        return newNode;\n    }\n    Node *temp = head;\n    while (temp->next != NULL) {\n        temp = temp->next;\n    }\n    temp->next = newNode;\n    return head;\n}\n\n// Single pointer: deletes node by key and returns updated head\nNode* deleteByValue(Node *head, int key) {\n    if (head == NULL) {\n        printf(\"List is empty! Nothing to delete.\\n\");\n        return NULL;\n    }\n\n    // If head node itself holds the key\n    if (head->data == key) {\n        Node *temp = head->next;\n        free(head);\n        printf(\"Node with value %d deleted.\\n\", key);\n        return temp;\n    }\n\n    Node *curr = head;\n    while (curr->next != NULL && curr->next->data != key) {\n        curr = curr->next;\n    }\n\n    if (curr->next == NULL) {\n        printf(\"Value %d not found in linked list.\\n\", key);\n        return head;\n    }\n\n    Node *toDelete = curr->next;\n    curr->next = toDelete->next;\n    free(toDelete);\n    printf(\"Node with value %d deleted.\\n\", key);\n    return head;\n}\n\n// Single pointer: in-place reversal returning new head\nNode* reverseList(Node *head) {\n    Node *prev = NULL;\n    Node *curr = head;\n    Node *next = NULL;\n\n    while (curr != NULL) {\n        next = curr->next; // Store next\n        curr->next = prev; // Reverse pointer\n        prev = curr;       // Move prev forward\n        curr = next;       // Move curr forward\n    }\n    printf(\"List reversed successfully!\\n\");\n    return prev;\n}\n\nvoid displayList(const Node *head) {\n    if (head == NULL) {\n        printf(\"Linked List: NULL\\n\");\n        return;\n    }\n    printf(\"Linked List: \");\n    const Node *temp = head;\n    while (temp != NULL) {\n        printf(\"[%d] -> \", temp->data);\n        temp = temp->next;\n    }\n    printf(\"NULL\\n\");\n}\n\nvoid freeList(Node *head) {\n    Node *temp;\n    while (head != NULL) {\n        temp = head;\n        head = head->next;\n        free(temp);\n    }\n}\n\nint main() {\n    Node *head = NULL;\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Singly Linked List   \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Singly Linked List Menu ---\\n\");\n        printf(\"1. Insert at Beginning (Head)\\n\");\n        printf(\"2. Insert at End (Tail)\\n\");\n        printf(\"3. Delete by Value\\n\");\n        printf(\"4. Reverse List in-place\\n\");\n        printf(\"5. Display List\\n\");\n        printf(\"6. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter value to insert at head: \");\n                scanf(\"%d\", &val);\n                head = insertAtHead(head, val);\n                displayList(head);\n                break;\n            case 2:\n                printf(\"Enter value to insert at tail: \");\n                scanf(\"%d\", &val);\n                head = insertAtTail(head, val);\n                displayList(head);\n                break;\n            case 3:\n                printf(\"Enter value to delete: \");\n                scanf(\"%d\", &val);\n                head = deleteByValue(head, val);\n                displayList(head);\n                break;\n            case 4:\n                head = reverseList(head);\n                displayList(head);\n                break;\n            case 5:\n                displayList(head);\n                break;\n            case 6:\n                freeList(head);\n                printf(\"Memory freed. Exiting.\\n\");\n                break;\n            default:\n                printf(\"Invalid option! Choose 1-6.\\n\");\n        }\n    } while (choice != 6);\n\n    return 0;\n}"
  },
  {
    "id": "doubly-linked-list",
    "title": "Doubly Linked List with Bi-directional Traversal",
    "filename": "doubly_linked_list.c",
    "topic": "Linked Lists",
    "topicId": "linked-lists",
    "subtopic": "Doubly Linked List",
    "difficulty": "Intermediate",
    "operations": [
      "Insert at Head",
      "Insert at Tail",
      "Delete Node",
      "Forward Traversal",
      "Backward Traversal"
    ],
    "timeComplexity": "Insert: O(1) head / O(n) tail, Delete: O(1) given node, Traversal: O(n)",
    "spaceComplexity": "O(1) auxiliary (two pointers per node)",
    "summary": "Two-way linked list containing both 'prev' and 'next' pointers, allowing forward and backward traversal.",
    "explanation": "A doubly linked list node has three fields: data, a prev pointer, and a next pointer. This enables deletion of a node in O(1) time if a pointer to it is already known without needing to traverse from head.",
    "functions": [
      {
        "name": "createDoublyNode",
        "signature": "DNode* createDoublyNode(int val)",
        "description": "Allocates memory for doubly linked node and sets prev and next to NULL."
      },
      {
        "name": "insertDoublyHead",
        "signature": "DNode* insertDoublyHead(DNode *head, int val)",
        "description": "Inserts a new node at the front, links pointers bidirectionally, and returns new head."
      },
      {
        "name": "insertDoublyTail",
        "signature": "DNode* insertDoublyTail(DNode *head, int val)",
        "description": "Appends a new node at the end of the doubly linked list and returns head."
      },
      {
        "name": "deleteDoublyNode",
        "signature": "DNode* deleteDoublyNode(DNode *head, int val)",
        "description": "Locates a node by value, adjusts adjacent prev/next pointers, frees memory, and returns head."
      },
      {
        "name": "displayForward",
        "signature": "void displayForward(const DNode *head)",
        "description": "Traverses list from head to tail printing all elements."
      },
      {
        "name": "displayBackward",
        "signature": "void displayBackward(const DNode *head)",
        "description": "Traverses list backwards using prev pointers from tail to head."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInserted 10, 20, 30\nForward Traversal : NULL <-> [10] <-> [20] <-> [30] <-> NULL\nBackward Traversal: NULL <-> [30] <-> [20] <-> [10] <-> NULL",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct DNode {\n    int data;\n    struct DNode *prev;\n    struct DNode *next;\n} DNode;\n\nDNode* createDoublyNode(int val) {\n    DNode *newNode = (DNode*)malloc(sizeof(DNode));\n    if (!newNode) {\n        printf(\"Memory allocation failed!\\n\");\n        exit(1);\n    }\n    newNode->data = val;\n    newNode->prev = NULL;\n    newNode->next = NULL;\n    return newNode;\n}\n\n// Single pointer: inserts at head and returns new head\nDNode* insertDoublyHead(DNode *head, int val) {\n    DNode *newNode = createDoublyNode(val);\n    if (head != NULL) {\n        newNode->next = head;\n        head->prev = newNode;\n    }\n    return newNode;\n}\n\n// Single pointer: appends to tail and returns head\nDNode* insertDoublyTail(DNode *head, int val) {\n    DNode *newNode = createDoublyNode(val);\n    if (head == NULL) {\n        return newNode;\n    }\n    DNode *temp = head;\n    while (temp->next != NULL) {\n        temp = temp->next;\n    }\n    temp->next = newNode;\n    newNode->prev = temp;\n    return head;\n}\n\n// Single pointer: deletes node by key and returns updated head\nDNode* deleteDoublyNode(DNode *head, int val) {\n    if (head == NULL) {\n        printf(\"List is empty.\\n\");\n        return NULL;\n    }\n\n    DNode *curr = head;\n    while (curr != NULL && curr->data != val) {\n        curr = curr->next;\n    }\n\n    if (curr == NULL) {\n        printf(\"Value %d not found in doubly linked list.\\n\", val);\n        return head;\n    }\n\n    // If head node to be deleted\n    if (curr == head) {\n        head = curr->next;\n        if (head != NULL) {\n            head->prev = NULL;\n        }\n    } else {\n        if (curr->next != NULL) {\n            curr->next->prev = curr->prev;\n        }\n        if (curr->prev != NULL) {\n            curr->prev->next = curr->next;\n        }\n    }\n\n    free(curr);\n    printf(\"Node with value %d deleted from doubly linked list.\\n\", val);\n    return head;\n}\n\nvoid displayForward(const DNode *head) {\n    if (head == NULL) {\n        printf(\"Forward:  NULL\\n\");\n        return;\n    }\n    printf(\"Forward:  NULL <-> \");\n    const DNode *temp = head;\n    while (temp != NULL) {\n        printf(\"[%d] <-> \", temp->data);\n        temp = temp->next;\n    }\n    printf(\"NULL\\n\");\n}\n\nvoid displayBackward(const DNode *head) {\n    if (head == NULL) {\n        printf(\"Backward: NULL\\n\");\n        return;\n    }\n    const DNode *temp = head;\n    while (temp->next != NULL) {\n        temp = temp->next;\n    }\n    printf(\"Backward: NULL <-> \");\n    while (temp != NULL) {\n        printf(\"[%d] <-> \", temp->data);\n        temp = temp->prev;\n    }\n    printf(\"NULL\\n\");\n}\n\nvoid freeDoublyList(DNode *head) {\n    DNode *temp;\n    while (head != NULL) {\n        temp = head;\n        head = head->next;\n        free(temp);\n    }\n}\n\nint main() {\n    DNode *head = NULL;\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Doubly Linked List   \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Doubly Linked List Menu ---\\n\");\n        printf(\"1. Insert Head\\n\");\n        printf(\"2. Insert Tail\\n\");\n        printf(\"3. Delete Node by Value\\n\");\n        printf(\"4. Display Forward & Backward\\n\");\n        printf(\"5. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter value: \");\n                scanf(\"%d\", &val);\n                head = insertDoublyHead(head, val);\n                displayForward(head);\n                break;\n            case 2:\n                printf(\"Enter value: \");\n                scanf(\"%d\", &val);\n                head = insertDoublyTail(head, val);\n                displayForward(head);\n                break;\n            case 3:\n                printf(\"Enter value to delete: \");\n                scanf(\"%d\", &val);\n                head = deleteDoublyNode(head, val);\n                displayForward(head);\n                break;\n            case 4:\n                displayForward(head);\n                displayBackward(head);\n                break;\n            case 5:\n                freeDoublyList(head);\n                printf(\"Memory freed. Exiting.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection.\\n\");\n        }\n    } while (choice != 5);\n\n    return 0;\n}"
  },
  {
    "id": "circular-linked-list",
    "title": "Circular Linked List: Insertion & Circular Traversal",
    "filename": "circular_linked_list.c",
    "topic": "Linked Lists",
    "topicId": "linked-lists",
    "subtopic": "Circular Linked List",
    "difficulty": "Intermediate",
    "operations": [
      "Insert at Head",
      "Insert at End",
      "Delete Node",
      "Circular Display"
    ],
    "timeComplexity": "Insert: O(1) with tail pointer / O(n), Traversal: O(n)",
    "spaceComplexity": "O(1)",
    "summary": "Linked list where the last node links back to the first node, forming an infinite circular ring structure.",
    "explanation": "There is no NULL at the end of a circular linked list. The stop condition during traversal is when the current pointer equals the head pointer again (using a do-while loop).",
    "functions": [
      {
        "name": "createNode",
        "signature": "Node* createNode(int val)",
        "description": "Allocates memory for a circular node."
      },
      {
        "name": "insertCircularHead",
        "signature": "Node* insertCircularHead(Node *head, int val)",
        "description": "Inserts at front, links the tail node back to the new head, and returns new head."
      },
      {
        "name": "insertCircularTail",
        "signature": "Node* insertCircularTail(Node *head, int val)",
        "description": "Appends at end, updates circular link to point back to head, and returns head."
      },
      {
        "name": "displayCircularList",
        "signature": "void displayCircularList(const Node *head)",
        "description": "Traverses circular list using do-while until head is reached again."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInsert: 10, 20, 30\nList: [10] -> [20] -> [30] -> (wraps back to [10])",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int data;\n    struct Node *next;\n} Node;\n\nNode* createNode(int val) {\n    Node *newNode = (Node*)malloc(sizeof(Node));\n    if (!newNode) {\n        printf(\"Memory allocation failed!\\n\");\n        exit(1);\n    }\n    newNode->data = val;\n    newNode->next = NULL;\n    return newNode;\n}\n\n// Single pointer: inserts at head and returns new head\nNode* insertCircularHead(Node *head, int val) {\n    Node *newNode = createNode(val);\n    if (head == NULL) {\n        newNode->next = newNode;\n        return newNode;\n    }\n    Node *temp = head;\n    while (temp->next != head) {\n        temp = temp->next;\n    }\n    newNode->next = head;\n    temp->next = newNode;\n    return newNode; // New node is new head\n}\n\n// Single pointer: inserts at tail and returns head\nNode* insertCircularTail(Node *head, int val) {\n    Node *newNode = createNode(val);\n    if (head == NULL) {\n        newNode->next = newNode;\n        return newNode;\n    }\n    Node *temp = head;\n    while (temp->next != head) {\n        temp = temp->next;\n    }\n    temp->next = newNode;\n    newNode->next = head;\n    return head;\n}\n\nvoid displayCircularList(const Node *head) {\n    if (head == NULL) {\n        printf(\"Circular List is empty.\\n\");\n        return;\n    }\n    const Node *temp = head;\n    printf(\"Circular List: \");\n    do {\n        printf(\"[%d] -> \", temp->data);\n        temp = temp->next;\n    } while (temp != head);\n    printf(\"(back to head: %d)\\n\", head->data);\n}\n\nvoid freeCircularList(Node *head) {\n    if (head == NULL) return;\n    Node *curr = head;\n    Node *next;\n    do {\n        next = curr->next;\n        free(curr);\n        curr = next;\n    } while (curr != head);\n}\n\nint main() {\n    Node *head = NULL;\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Circular Linked List \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Menu ---\\n\");\n        printf(\"1. Insert Head\\n\");\n        printf(\"2. Insert Tail\\n\");\n        printf(\"3. Display Circular List\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter value: \");\n                scanf(\"%d\", &val);\n                head = insertCircularHead(head, val);\n                displayCircularList(head);\n                break;\n            case 2:\n                printf(\"Enter value: \");\n                scanf(\"%d\", &val);\n                head = insertCircularTail(head, val);\n                displayCircularList(head);\n                break;\n            case 3:\n                displayCircularList(head);\n                break;\n            case 4:\n                freeCircularList(head);\n                printf(\"Memory freed. Exiting.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection!\\n\");\n        }\n    } while (choice != 4);\n\n    return 0;\n}"
  },
  {
    "id": "binary-search-tree",
    "title": "Binary Search Tree (BST): Insert, Search, Traversals & Deletion",
    "filename": "binary_search_tree.c",
    "topic": "Trees",
    "topicId": "trees",
    "subtopic": "Binary Search Tree",
    "difficulty": "Intermediate",
    "operations": [
      "BST Insertion",
      "BST Search",
      "Inorder Traversal",
      "Preorder Traversal",
      "Postorder Traversal",
      "Find Min/Max",
      "Delete Node (0, 1, 2 children)"
    ],
    "timeComplexity": "Search/Insert/Delete: O(log n) average, O(n) worst-case",
    "spaceComplexity": "O(h) recursion call stack",
    "summary": "Hierarchical tree structure maintaining the BST property (left < root < right), producing sorted output through inorder traversal, and handling all 3 cases of node deletion.",
    "explanation": "For every node, all values in its left subtree are strictly smaller and all values in its right subtree are strictly greater. Inorder traversal (Left, Root, Right) always prints elements in ascending sorted order. Node deletion handles three cases: (1) leaf node (simply free), (2) node with one child (bypass to child), (3) node with two children (replace with inorder successor).",
    "functions": [
      {
        "name": "insertBST",
        "signature": "TreeNode* insertBST(TreeNode *root, int val)",
        "description": "Recursively places value in left or right subtree maintaining BST property."
      },
      {
        "name": "searchBST",
        "signature": "TreeNode* searchBST(TreeNode *root, int key)",
        "description": "Searches for key by halving comparison branches."
      },
      {
        "name": "inorder",
        "signature": "void inorder(const TreeNode *root)",
        "description": "Left -> Root -> Right traversal (prints in sorted order)."
      },
      {
        "name": "preorder",
        "signature": "void preorder(const TreeNode *root)",
        "description": "Root -> Left -> Right traversal."
      },
      {
        "name": "postorder",
        "signature": "void postorder(const TreeNode *root)",
        "description": "Left -> Right -> Root traversal."
      },
      {
        "name": "findMin",
        "signature": "TreeNode* findMin(TreeNode *root)",
        "description": "Finds the leftmost node containing the minimum value."
      },
      {
        "name": "deleteNode",
        "signature": "TreeNode* deleteNode(TreeNode *root, int key)",
        "description": "Deletes node considering 0, 1, or 2 children (using inorder successor)."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInserted keys: 50, 30, 70, 20, 40, 60, 80\nInorder (Sorted)   : 20 30 40 50 60 70 80\nPreorder           : 50 30 20 40 70 60 80\nPostorder          : 20 40 30 60 80 70 50\nSearch for 40      : Key 40 found in BST!\nDelete 50 (Root)   : Replaced with inorder successor 60.\nNew Inorder        : 20 30 40 60 70 80",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct TreeNode {\n    int data;\n    struct TreeNode *left;\n    struct TreeNode *right;\n} TreeNode;\n\nTreeNode* createTreeNode(int val) {\n    TreeNode *node = (TreeNode*)malloc(sizeof(TreeNode));\n    node->data = val;\n    node->left = NULL;\n    node->right = NULL;\n    return node;\n}\n\nTreeNode* insertBST(TreeNode *root, int val) {\n    if (root == NULL) {\n        return createTreeNode(val);\n    }\n    if (val < root->data) {\n        root->left = insertBST(root->left, val);\n    } else if (val > root->data) {\n        root->right = insertBST(root->right, val);\n    } else {\n        printf(\"Duplicate key %d ignored (BST contains unique keys).\\n\", val);\n    }\n    return root;\n}\n\nTreeNode* searchBST(TreeNode *root, int key) {\n    if (root == NULL || root->data == key) return root;\n    if (key < root->data) return searchBST(root->left, key);\n    return searchBST(root->right, key);\n}\n\nvoid inorder(const TreeNode *root) {\n    if (root != NULL) {\n        inorder(root->left);\n        printf(\"%d \", root->data);\n        inorder(root->right);\n    }\n}\n\nvoid preorder(const TreeNode *root) {\n    if (root != NULL) {\n        printf(\"%d \", root->data);\n        preorder(root->left);\n        preorder(root->right);\n    }\n}\n\nvoid postorder(const TreeNode *root) {\n    if (root != NULL) {\n        postorder(root->left);\n        postorder(root->right);\n        printf(\"%d \", root->data);\n    }\n}\n\nTreeNode* findMin(TreeNode *root) {\n    while (root && root->left != NULL) {\n        root = root->left;\n    }\n    return root;\n}\n\nTreeNode* deleteNode(TreeNode *root, int key) {\n    if (root == NULL) return root;\n\n    if (key < root->data) {\n        root->left = deleteNode(root->left, key);\n    } else if (key > root->data) {\n        root->right = deleteNode(root->right, key);\n    } else {\n        // Node found! Handle cases:\n        // Case 1 & 2: Node with only one child or no child\n        if (root->left == NULL) {\n            TreeNode *temp = root->right;\n            free(root);\n            return temp;\n        } else if (root->right == NULL) {\n            TreeNode *temp = root->left;\n            free(root);\n            return temp;\n        }\n\n        // Case 3: Node with two children\n        // Get the inorder successor (smallest in the right subtree)\n        TreeNode *temp = findMin(root->right);\n        root->data = temp->data;\n        // Delete the inorder successor\n        root->right = deleteNode(root->right, temp->data);\n    }\n    return root;\n}\n\nint main() {\n    TreeNode *root = NULL;\n    int choice, val;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Binary Search Tree   \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- BST Menu ---\\n\");\n        printf(\"1. Insert Key\\n\");\n        printf(\"2. Search Key\\n\");\n        printf(\"3. Inorder Traversal (Sorted)\\n\");\n        printf(\"4. Preorder Traversal\\n\");\n        printf(\"5. Postorder Traversal\\n\");\n        printf(\"6. Delete Key\\n\");\n        printf(\"7. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter integer key to insert: \");\n                scanf(\"%d\", &val);\n                root = insertBST(root, val);\n                printf(\"Inorder now: \");\n                inorder(root);\n                printf(\"\\n\");\n                break;\n            case 2:\n                printf(\"Enter key to search: \");\n                scanf(\"%d\", &val);\n                if (searchBST(root, val)) {\n                    printf(\"Key %d FOUND in BST!\\n\", val);\n                } else {\n                    printf(\"Key %d NOT found in BST.\\n\", val);\n                }\n                break;\n            case 3:\n                printf(\"Inorder Traversal: \");\n                inorder(root);\n                printf(\"\\n\");\n                break;\n            case 4:\n                printf(\"Preorder Traversal: \");\n                preorder(root);\n                printf(\"\\n\");\n                break;\n            case 5:\n                printf(\"Postorder Traversal: \");\n                postorder(root);\n                printf(\"\\n\");\n                break;\n            case 6:\n                printf(\"Enter key to delete: \");\n                scanf(\"%d\", &val);\n                root = deleteNode(root, val);\n                printf(\"Inorder after deletion: \");\n                inorder(root);\n                printf(\"\\n\");\n                break;\n            case 7:\n                printf(\"Exiting BST lab.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection!\\n\");\n        }\n    } while (choice != 7);\n\n    return 0;\n}"
  },
  {
    "id": "avl-self-balancing-tree",
    "title": "AVL Tree: Self-Balancing BST with LL, RR, LR & RL Rotations",
    "filename": "avl_tree.c",
    "topic": "Trees",
    "topicId": "trees",
    "subtopic": "AVL Trees",
    "difficulty": "Advanced",
    "operations": [
      "Balance Factor Calculation",
      "Left Rotation (LL)",
      "Right Rotation (RR)",
      "Left-Right Rotation (LR)",
      "Right-Left Rotation (RL)",
      "AVL Insertion"
    ],
    "timeComplexity": "Search, Insert, Delete: Strictly O(log n)",
    "spaceComplexity": "O(log n) stack",
    "summary": "Height-balanced Binary Search Tree ensuring height difference (balance factor) between left and right subtrees never exceeds 1 via 4 dynamic rotation types.",
    "explanation": "AVL trees guarantee O(log n) worst-case time complexity. For every node, Balance Factor = height(left) - height(right). If BF > 1 or BF < -1, the tree is rebalanced using single or double rotations (Right Rotation for Left-Left, Left Rotation for Right-Right, Left-Right, or Right-Left).",
    "functions": [
      {
        "name": "height",
        "signature": "int height(const AVLNode *n)",
        "description": "Returns height of node or 0 if NULL."
      },
      {
        "name": "getBalance",
        "signature": "int getBalance(const AVLNode *n)",
        "description": "Computes balance factor = height(left) - height(right)."
      },
      {
        "name": "rightRotate",
        "signature": "AVLNode* rightRotate(AVLNode *y)",
        "description": "Performs right rotation around node y."
      },
      {
        "name": "leftRotate",
        "signature": "AVLNode* leftRotate(AVLNode *x)",
        "description": "Performs left rotation around node x."
      },
      {
        "name": "insertAVL",
        "signature": "AVLNode* insertAVL(AVLNode *node, int key)",
        "description": "Recursively inserts and applies appropriate rotation if unbalanced."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInsert: 10, 20, 30 (Causes RR imbalance) -> Rotated left: 20 becomes root!\nInsert: 40, 50, 25 (Balanced automatically)\nInorder Traversal (Sorted): 10 20 25 30 40 50\nPreorder (Shows balanced structure): 30 20 10 25 40 50",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct AVLNode {\n    int key;\n    struct AVLNode *left;\n    struct AVLNode *right;\n    int height;\n} AVLNode;\n\nint max(int a, int b) {\n    return (a > b) ? a : b;\n}\n\nint height(const AVLNode *n) {\n    if (n == NULL) return 0;\n    return n->height;\n}\n\nAVLNode* createAVLNode(int key) {\n    AVLNode *node = (AVLNode*)malloc(sizeof(AVLNode));\n    node->key = key;\n    node->left = NULL;\n    node->right = NULL;\n    node->height = 1; // New node is initially added at leaf\n    return node;\n}\n\nAVLNode* rightRotate(AVLNode *y) {\n    AVLNode *x = y->left;\n    AVLNode *T2 = x->right;\n\n    // Perform rotation\n    x->right = y;\n    y->left = T2;\n\n    // Update heights\n    y->height = max(height(y->left), height(y->right)) + 1;\n    x->height = max(height(x->left), height(x->right)) + 1;\n\n    return x; // New root\n}\n\nAVLNode* leftRotate(AVLNode *x) {\n    AVLNode *y = x->right;\n    AVLNode *T2 = y->left;\n\n    // Perform rotation\n    y->left = x;\n    x->right = T2;\n\n    // Update heights\n    x->height = max(height(x->left), height(x->right)) + 1;\n    y->height = max(height(y->left), height(y->right)) + 1;\n\n    return y; // New root\n}\n\nint getBalance(const AVLNode *n) {\n    if (n == NULL) return 0;\n    return height(n->left) - height(n->right);\n}\n\nAVLNode* insertAVL(AVLNode *node, int key) {\n    // 1. Standard BST insertion\n    if (node == NULL) return createAVLNode(key);\n\n    if (key < node->key) {\n        node->left = insertAVL(node->left, key);\n    } else if (key > node->key) {\n        node->right = insertAVL(node->right, key);\n    } else {\n        return node; // Duplicate keys not allowed in standard AVL\n    }\n\n    // 2. Update height of this ancestor node\n    node->height = 1 + max(height(node->left), height(node->right));\n\n    // 3. Get the balance factor\n    int balance = getBalance(node);\n\n    // If unbalanced, 4 rotation cases:\n\n    // Case 1: Left Left (LL)\n    if (balance > 1 && key < node->left->key) {\n        return rightRotate(node);\n    }\n\n    // Case 2: Right Right (RR)\n    if (balance < -1 && key > node->right->key) {\n        return leftRotate(node);\n    }\n\n    // Case 3: Left Right (LR)\n    if (balance > 1 && key > node->left->key) {\n        node->left = leftRotate(node->left);\n        return rightRotate(node);\n    }\n\n    // Case 4: Right Left (RL)\n    if (balance < -1 && key < node->right->key) {\n        node->right = rightRotate(node->right);\n        return leftRotate(node);\n    }\n\n    return node;\n}\n\nvoid preOrder(const AVLNode *root) {\n    if (root != NULL) {\n        printf(\"%d (BF:%d) \", root->key, getBalance(root));\n        preOrder(root->left);\n        preOrder(root->right);\n    }\n}\n\nvoid inOrder(const AVLNode *root) {\n    if (root != NULL) {\n        inOrder(root->left);\n        printf(\"%d \", root->key);\n        inOrder(root->right);\n    }\n}\n\nint main() {\n    AVLNode *root = NULL;\n    int choice, key;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Self-Balancing AVL   \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- AVL Tree Menu ---\\n\");\n        printf(\"1. Insert Key (Auto-balanced)\\n\");\n        printf(\"2. Preorder Traversal (with Balance Factor)\\n\");\n        printf(\"3. Inorder Traversal (Sorted)\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter key to insert: \");\n                scanf(\"%d\", &key);\n                root = insertAVL(root, key);\n                printf(\"Inserted %d. Root is now %d.\\n\", key, root->key);\n                break;\n            case 2:\n                printf(\"Preorder Traversal: \");\n                preOrder(root);\n                printf(\"\\n\");\n                break;\n            case 3:\n                printf(\"Inorder Traversal : \");\n                inOrder(root);\n                printf(\"\\n\");\n                break;\n            case 4:\n                printf(\"Exiting AVL Tree.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection.\\n\");\n        }\n    } while (choice != 4);\n\n    return 0;\n}"
  },
  {
    "id": "graph-bfs-dfs-traversal",
    "title": "Graph Algorithms: Adjacency Matrix, BFS & DFS",
    "filename": "graph_bfs_dfs.c",
    "topic": "Graphs",
    "topicId": "graphs",
    "subtopic": "Graph Traversals",
    "difficulty": "Intermediate",
    "operations": [
      "Add Edge",
      "Adjacency Matrix Display",
      "Breadth-First Search (BFS)",
      "Depth-First Search (DFS)"
    ],
    "timeComplexity": "BFS: O(V^2), DFS: O(V^2) with Adjacency Matrix",
    "spaceComplexity": "O(V) visited array & queue stack",
    "summary": "Graph representation using Adjacency Matrix with Breadth-First Search (level-by-level using Queue) and Depth-First Search (branch-by-branch using recursion).",
    "explanation": "BFS explores all immediate neighbors first using an explicit FIFO queue. DFS explores as deep as possible along each branch before backtracking using recursive calls or an explicit stack. Both maintain a 'visited' array to prevent infinite cycles.",
    "functions": [
      {
        "name": "addEdge",
        "signature": "void addEdge(int u, int v, int directed)",
        "description": "Sets edge bit in adjacency matrix."
      },
      {
        "name": "BFS",
        "signature": "void BFS(int startVertex, int vertices)",
        "description": "Executes Breadth-First Search using a queue."
      },
      {
        "name": "DFS",
        "signature": "void DFS(int vertex, int visited[], int vertices)",
        "description": "Executes recursive Depth-First Search."
      },
      {
        "name": "displayAdjMatrix",
        "signature": "void displayAdjMatrix(int vertices)",
        "description": "Displays formatted adjacency matrix table."
      }
    ],
    "sampleInputOutput": "Sample Run:\nVertices: 4 (0, 1, 2, 3)\nEdges: (0,1), (0,2), (1,2), (2,3)\nBFS starting from 0: 0 -> 1 -> 2 -> 3\nDFS starting from 0: 0 -> 1 -> 2 -> 3",
    "code": "#include <stdio.h>\n#define MAX_VERTICES 20\n\nint adj[MAX_VERTICES][MAX_VERTICES];\nint visited[MAX_VERTICES];\n\nvoid initGraph(int vertices) {\n    for (int i = 0; i < vertices; i++) {\n        for (int j = 0; j < vertices; j++) {\n            adj[i][j] = 0;\n        }\n    }\n}\n\nvoid addEdge(int u, int v, int directed) {\n    adj[u][v] = 1;\n    if (!directed) {\n        adj[v][u] = 1;\n    }\n}\n\nvoid displayAdjMatrix(int vertices) {\n    printf(\"\\n--- Adjacency Matrix (%d x %d) ---\\n\", vertices, vertices);\n    printf(\"     \");\n    for (int i = 0; i < vertices; i++) printf(\"%3d \", i);\n    printf(\"\\n   +\");\n    for (int i = 0; i < vertices; i++) printf(\"----\");\n    printf(\"\\n\");\n\n    for (int i = 0; i < vertices; i++) {\n        printf(\"%2d | \", i);\n        for (int j = 0; j < vertices; j++) {\n            printf(\"%3d \", adj[i][j]);\n        }\n        printf(\"\\n\");\n    }\n}\n\n// Breadth-First Search using an explicit Queue\nvoid BFS(int start, int vertices) {\n    int queue[MAX_VERTICES];\n    int front = 0, rear = 0;\n    int visitedBFS[MAX_VERTICES] = {0};\n\n    visitedBFS[start] = 1;\n    queue[rear++] = start;\n\n    printf(\"BFS Traversal from vertex %d: \", start);\n\n    while (front < rear) {\n        int curr = queue[front++];\n        printf(\"%d \", curr);\n\n        for (int i = 0; i < vertices; i++) {\n            if (adj[curr][i] == 1 && !visitedBFS[i]) {\n                visitedBFS[i] = 1;\n                queue[rear++] = i;\n            }\n        }\n    }\n    printf(\"\\n\");\n}\n\n// Depth-First Search using Recursion\nvoid DFS(int curr, int visitedDFS[], int vertices) {\n    visitedDFS[curr] = 1;\n    printf(\"%d \", curr);\n\n    for (int i = 0; i < vertices; i++) {\n        if (adj[curr][i] == 1 && !visitedDFS[i]) {\n            DFS(i, visitedDFS, vertices);\n        }\n    }\n}\n\nint main() {\n    int vertices, edges, u, v, choice, start;\n    int isDirected = 0;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Graph BFS & DFS      \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of vertices (max %d): \", MAX_VERTICES);\n    scanf(\"%d\", &vertices);\n    initGraph(vertices);\n\n    printf(\"Is graph directed? (1 for Yes, 0 for No): \");\n    scanf(\"%d\", &isDirected);\n\n    printf(\"Enter number of edges: \");\n    scanf(\"%d\", &edges);\n\n    printf(\"Enter edges (u v) 0-indexed:\\n\");\n    for (int i = 0; i < edges; i++) {\n        printf(\"Edge %d: \", i + 1);\n        scanf(\"%d %d\", &u, &v);\n        if (u >= 0 && u < vertices && v >= 0 && v < vertices) {\n            addEdge(u, v, isDirected);\n        } else {\n            printf(\"Invalid vertices! Ignored.\\n\");\n        }\n    }\n\n    displayAdjMatrix(vertices);\n\n    do {\n        printf(\"\\n--- Graph Menu ---\\n\");\n        printf(\"1. Breadth-First Search (BFS)\\n\");\n        printf(\"2. Depth-First Search (DFS)\\n\");\n        printf(\"3. Display Adjacency Matrix\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter start vertex for BFS (0 to %d): \", vertices - 1);\n                scanf(\"%d\", &start);\n                if (start >= 0 && start < vertices) {\n                    BFS(start, vertices);\n                } else {\n                    printf(\"Invalid start vertex!\\n\");\n                }\n                break;\n            case 2:\n                printf(\"Enter start vertex for DFS (0 to %d): \", vertices - 1);\n                scanf(\"%d\", &start);\n                if (start >= 0 && start < vertices) {\n                    int visitedDFS[MAX_VERTICES] = {0};\n                    printf(\"DFS Traversal from vertex %d: \", start);\n                    DFS(start, visitedDFS, vertices);\n                    printf(\"\\n\");\n                } else {\n                    printf(\"Invalid start vertex!\\n\");\n                }\n                break;\n            case 3:\n                displayAdjMatrix(vertices);\n                break;\n            case 4:\n                printf(\"Exiting graph module.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection.\\n\");\n        }\n    } while (choice != 4);\n\n    return 0;\n}"
  },
  {
    "id": "dijkstra-shortest-path",
    "title": "Dijkstra's Algorithm: Single-Source Shortest Path",
    "filename": "dijkstra_algorithm.c",
    "topic": "Graphs",
    "topicId": "graphs",
    "subtopic": "Shortest Path",
    "difficulty": "Advanced",
    "operations": [
      "Shortest Path Calculation",
      "Path Reconstruction",
      "Distance Table"
    ],
    "timeComplexity": "O(V^2) with Adjacency Matrix",
    "spaceComplexity": "O(V) distance and parent arrays",
    "summary": "Greedy algorithm finding the minimum distance from a designated starting source node to all other nodes in a non-negative weighted graph.",
    "explanation": "Maintains a set of visited vertices whose shortest distance is confirmed. At each iteration, selects the unvisited vertex with the minimum tentative distance, marks it visited, and relaxes the distances to all its adjacent neighbors.",
    "functions": [
      {
        "name": "minDistance",
        "signature": "int minDistance(int dist[], int sptSet[], int V)",
        "description": "Finds the vertex with minimum distance among unvisited vertices."
      },
      {
        "name": "dijkstra",
        "signature": "void dijkstra(int graph[MAX][MAX], int src, int V)",
        "description": "Computes shortest distance array and prints path from source."
      }
    ],
    "sampleInputOutput": "Sample Run:\nGraph with 5 vertices (0 to 4)\nSource: 0\nVertex | Shortest Distance from Source 0\n-----------------------------------------\n  0    | 0\n  1    | 4\n  2    | 12\n  3    | 19\n  4    | 21",
    "code": "#include <stdio.h>\n#include <limits.h>\n\n#define MAX_V 10\n\nint minDistance(const int dist[], const int sptSet[], int V) {\n    int min = INT_MAX, min_index = -1;\n    for (int v = 0; v < V; v++) {\n        if (!sptSet[v] && dist[v] <= min) {\n            min = dist[v];\n            min_index = v;\n        }\n    }\n    return min_index;\n}\n\nvoid printSolution(const int dist[], int V, int src) {\n    printf(\"\\n--- Shortest Distances from Source %d ---\\n\", src);\n    printf(\" Destination Vertex | Shortest Distance \\n\");\n    printf(\"--------------------+-------------------\\n\");\n    for (int i = 0; i < V; i++) {\n        if (dist[i] == INT_MAX) {\n            printf(\"         %2d         |     Unreachable   \\n\", i);\n        } else {\n            printf(\"         %2d         |         %4d      \\n\", i, dist[i]);\n        }\n    }\n}\n\nvoid dijkstra(const int graph[MAX_V][MAX_V], int src, int V) {\n    int dist[MAX_V];\n    int sptSet[MAX_V];\n\n    for (int i = 0; i < V; i++) {\n        dist[i] = INT_MAX;\n        sptSet[i] = 0;\n    }\n\n    dist[src] = 0;\n\n    for (int count = 0; count < V - 1; count++) {\n        int u = minDistance(dist, sptSet, V);\n        if (u == -1) break;\n\n        sptSet[u] = 1;\n\n        for (int v = 0; v < V; v++) {\n            if (!sptSet[v] && graph[u][v] && dist[u] != INT_MAX\n                && dist[u] + graph[u][v] < dist[v]) {\n                dist[v] = dist[u] + graph[u][v];\n            }\n        }\n    }\n\n    printSolution(dist, V, src);\n}\n\nint main() {\n    int V, src;\n    int graph[MAX_V][MAX_V];\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Dijkstra Algorithm   \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of vertices (e.g. 5): \");\n    scanf(\"%d\", &V);\n\n    printf(\"Enter adjacency matrix with edge weights (0 for no edge):\\n\");\n    for (int i = 0; i < V; i++) {\n        for (int j = 0; j < V; j++) {\n            scanf(\"%d\", &graph[i][j]);\n        }\n    }\n\n    printf(\"Enter source vertex (0 to %d): \", V - 1);\n    scanf(\"%d\", &src);\n\n    dijkstra(graph, src, V);\n\n    return 0;\n}"
  },
  {
    "id": "searching-linear-binary",
    "title": "Searching: Linear Search & Binary Search (Iterative & Recursive)",
    "filename": "searching_algorithms.c",
    "topic": "Searching Algorithms",
    "topicId": "searching",
    "subtopic": "Searching Techniques",
    "difficulty": "Beginner",
    "operations": [
      "Linear Search",
      "Binary Search (Iterative)",
      "Binary Search (Recursive)"
    ],
    "timeComplexity": "Linear: O(n), Binary: O(log n)",
    "spaceComplexity": "Iterative: O(1), Recursive: O(log n)",
    "summary": "Comprehensive comparison and implementation of fundamental linear sequential search vs divide-and-conquer binary search on sorted data.",
    "explanation": "Linear search checks each element one by one from left to right. Binary search requires the array to be sorted, compares the target with the middle element, and eliminates half the search space in each iteration, giving logarithmic O(log n) efficiency.",
    "functions": [
      {
        "name": "linearSearch",
        "signature": "int linearSearch(int arr[], int n, int key)",
        "description": "Checks elements sequentially in O(n) time."
      },
      {
        "name": "binarySearchIterative",
        "signature": "int binarySearchIterative(int arr[], int n, int key)",
        "description": "Divides sorted search interval using while loop in O(log n)."
      },
      {
        "name": "binarySearchRecursive",
        "signature": "int binarySearchRecursive(int arr[], int low, int high, int key)",
        "description": "Recursive divide-and-conquer binary search."
      }
    ],
    "sampleInputOutput": "Sample Run:\nArray: [10, 25, 34, 48, 62, 75, 89]\nSearch Key: 48\nResult: Element found at index 3 (4 comparisons in linear, 1 comparison in binary)!",
    "code": "#include <stdio.h>\n\nint linearSearch(const int arr[], int n, int key, int *comparisons) {\n    *comparisons = 0;\n    for (int i = 0; i < n; i++) {\n        (*comparisons)++;\n        if (arr[i] == key) return i;\n    }\n    return -1;\n}\n\nint binarySearchIterative(const int arr[], int n, int key, int *comparisons) {\n    int low = 0, high = n - 1;\n    *comparisons = 0;\n\n    while (low <= high) {\n        (*comparisons)++;\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == key) return mid;\n        else if (arr[mid] < key) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n\nint binarySearchRecursive(const int arr[], int low, int high, int key, int *comparisons) {\n    if (low > high) return -1;\n    (*comparisons)++;\n    int mid = low + (high - low) / 2;\n    if (arr[mid] == key) return mid;\n    if (arr[mid] > key) return binarySearchRecursive(arr, low, mid - 1, key, comparisons);\n    return binarySearchRecursive(arr, mid + 1, high, key, comparisons);\n}\n\nint main() {\n    int n, key, choice, index, comps;\n    int arr[100];\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Searching Algorithms \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of elements: \");\n    scanf(\"%d\", &n);\n\n    printf(\"Enter %d sorted elements (for binary search): \", n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n\n    do {\n        printf(\"\\n--- Search Menu ---\\n\");\n        printf(\"1. Linear Search\\n\");\n        printf(\"2. Binary Search (Iterative)\\n\");\n        printf(\"3. Binary Search (Recursive)\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        if (choice >= 1 && choice <= 3) {\n            printf(\"Enter search key: \");\n            scanf(\"%d\", &key);\n        }\n\n        switch (choice) {\n            case 1:\n                index = linearSearch(arr, n, key, &comps);\n                if (index != -1)\n                    printf(\"Linear: Key %d found at index %d (%d comparisons).\\n\", key, index, comps);\n                else\n                    printf(\"Linear: Key %d not found (%d comparisons).\\n\", key, comps);\n                break;\n            case 2:\n                index = binarySearchIterative(arr, n, key, &comps);\n                if (index != -1)\n                    printf(\"Binary (Iterative): Key %d found at index %d (%d comparisons).\\n\", key, index, comps);\n                else\n                    printf(\"Binary: Key %d not found (%d comparisons).\\n\", key, comps);\n                break;\n            case 3:\n                comps = 0;\n                index = binarySearchRecursive(arr, 0, n - 1, key, &comps);\n                if (index != -1)\n                    printf(\"Binary (Recursive): Key %d found at index %d (%d comparisons).\\n\", key, index, comps);\n                else\n                    printf(\"Binary: Key %d not found (%d comparisons).\\n\", key, comps);\n                break;\n            case 4:\n                printf(\"Exiting search.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection.\\n\");\n        }\n    } while (choice != 4);\n\n    return 0;\n}"
  },
  {
    "id": "sorting-bubble-selection-insertion",
    "title": "Elementary Sorts: Bubble, Selection & Insertion Sort",
    "filename": "elementary_sorts.c",
    "topic": "Sorting Algorithms",
    "topicId": "sorting",
    "subtopic": "Elementary Sorts",
    "difficulty": "Beginner",
    "operations": [
      "Bubble Sort (Optimized)",
      "Selection Sort",
      "Insertion Sort"
    ],
    "timeComplexity": "Bubble: O(n^2), Selection: O(n^2), Insertion: O(n^2) worst / O(n) best",
    "spaceComplexity": "O(1) in-place",
    "summary": "The three classic comparison-based sorting algorithms implemented with pass-by-pass tracing and swap counting.",
    "explanation": "Bubble Sort repeatedly swaps adjacent out-of-order elements (bubbles largest to end). Selection Sort finds the minimum from unsorted portion and swaps into place. Insertion Sort takes elements one by one and inserts them into their correct position in the sorted sub-array.",
    "functions": [
      {
        "name": "bubbleSort",
        "signature": "void bubbleSort(int arr[], int n)",
        "description": "Bubble sort with early exit flag if already sorted."
      },
      {
        "name": "selectionSort",
        "signature": "void selectionSort(int arr[], int n)",
        "description": "Selection sort finding minimum index per pass."
      },
      {
        "name": "insertionSort",
        "signature": "void insertionSort(int arr[], int n)",
        "description": "Insertion sort shifting larger elements right."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInput Array: [64, 25, 12, 22, 11]\nSorted Output: [11, 12, 22, 25, 64]",
    "code": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\n\nvoid printArray(const int arr[], int n) {\n    printf(\"[ \");\n    for (int i = 0; i < n; i++) printf(\"%d%s\", arr[i], (i == n - 1) ? \"\" : \", \");\n    printf(\" ]\\n\");\n}\n\nvoid bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n - 1; i++) {\n        int swapped = 0;\n        for (int j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                swap(&arr[j], &arr[j + 1]);\n                swapped = 1;\n            }\n        }\n        if (!swapped) break; // Array already sorted\n    }\n}\n\nvoid selectionSort(int arr[], int n) {\n    for (int i = 0; i < n - 1; i++) {\n        int min_idx = i;\n        for (int j = i + 1; j < n; j++) {\n            if (arr[j] < arr[min_idx]) {\n                min_idx = j;\n            }\n        }\n        if (min_idx != i) {\n            swap(&arr[i], &arr[min_idx]);\n        }\n    }\n}\n\nvoid insertionSort(int arr[], int n) {\n    for (int i = 1; i < n; i++) {\n        int key = arr[i];\n        int j = i - 1;\n        while (j >= 0 && arr[j] > key) {\n            arr[j + 1] = arr[j];\n            j = j - 1;\n        }\n        arr[j + 1] = key;\n    }\n}\n\nint main() {\n    int n, choice;\n    int arr[100], copy[100];\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Elementary Sorts     \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of elements: \");\n    scanf(\"%d\", &n);\n\n    printf(\"Enter %d integers: \", n);\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &arr[i]);\n    }\n\n    do {\n        for (int i = 0; i < n; i++) copy[i] = arr[i]; // fresh copy\n\n        printf(\"\\n--- Sorting Menu ---\\n\");\n        printf(\"1. Bubble Sort\\n\");\n        printf(\"2. Selection Sort\\n\");\n        printf(\"3. Insertion Sort\\n\");\n        printf(\"4. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                bubbleSort(copy, n);\n                printf(\"Result (Bubble Sort)   : \");\n                printArray(copy, n);\n                break;\n            case 2:\n                selectionSort(copy, n);\n                printf(\"Result (Selection Sort): \");\n                printArray(copy, n);\n                break;\n            case 3:\n                insertionSort(copy, n);\n                printf(\"Result (Insertion Sort): \");\n                printArray(copy, n);\n                break;\n            case 4:\n                printf(\"Exiting sorting module.\\n\");\n                break;\n            default:\n                printf(\"Invalid option!\\n\");\n        }\n    } while (choice != 4);\n\n    return 0;\n}"
  },
  {
    "id": "merge-sort",
    "title": "Merge Sort: Divide & Conquer (Stable O(n log n))",
    "filename": "merge_sort.c",
    "topic": "Searching & Sorting",
    "topicId": "sorting-searching",
    "subtopic": "Advanced Sorts",
    "difficulty": "Intermediate",
    "operations": [
      "Divide Array",
      "Conquer / Merge Subroutines",
      "Sorted Display"
    ],
    "timeComplexity": "Best, Average, Worst: O(n log n)",
    "spaceComplexity": "O(n) auxiliary array",
    "summary": "Guaranteed O(n log n) stable sorting algorithm dividing arrays recursively into halves and merging sorted halves.",
    "explanation": "Merge Sort recursively halves the array until sub-arrays of size 1 remain. Then the merge() function compares elements from both sorted halves and copies them into an auxiliary buffer in sorted order, copying back into the original array.",
    "functions": [
      {
        "name": "merge",
        "signature": "void merge(int arr[], int l, int m, int r)",
        "description": "Merges two sorted sub-arrays arr[l..m] and arr[m+1..r]."
      },
      {
        "name": "mergeSort",
        "signature": "void mergeSort(int arr[], int l, int r)",
        "description": "Recursive divide and conquer routine."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInput: [38, 27, 43, 3, 9, 82, 10]\nOutput: [3, 9, 10, 27, 38, 43, 82]",
    "code": "#include <stdio.h>\n\nvoid merge(int arr[], int l, int m, int r) {\n    int n1 = m - l + 1;\n    int n2 = r - m;\n\n    int L[n1], R[n2];\n\n    for (int i = 0; i < n1; i++) L[i] = arr[l + i];\n    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];\n\n    int i = 0, j = 0, k = l;\n    while (i < n1 && j < n2) {\n        if (L[i] <= R[j]) {\n            arr[k++] = L[i++];\n        } else {\n            arr[k++] = R[j++];\n        }\n    }\n\n    while (i < n1) arr[k++] = L[i++];\n    while (j < n2) arr[k++] = R[j++];\n}\n\nvoid mergeSort(int arr[], int l, int r) {\n    if (l < r) {\n        int m = l + (r - l) / 2;\n        mergeSort(arr, l, m);\n        mergeSort(arr, m + 1, r);\n        merge(arr, l, m, r);\n    }\n}\n\nint main() {\n    int n;\n    int arr[100];\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Merge Sort           \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of elements: \");\n    scanf(\"%d\", &n);\n\n    printf(\"Enter %d integers: \", n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n\n    mergeSort(arr, 0, n - 1);\n\n    printf(\"\\nSorted Array: [ \");\n    for (int i = 0; i < n; i++) printf(\"%d%s\", arr[i], (i == n - 1) ? \"\" : \", \");\n    printf(\" ]\\n\");\n\n    return 0;\n}"
  },
  {
    "id": "quick-sort",
    "title": "Quick Sort: Divide & Conquer with Partitioning",
    "filename": "quick_sort.c",
    "topic": "Searching & Sorting",
    "topicId": "sorting-searching",
    "subtopic": "Advanced Sorts",
    "difficulty": "Intermediate",
    "operations": [
      "Pivot Selection",
      "Lomuto Partitioning",
      "Recursive QuickSort"
    ],
    "timeComplexity": "Best/Avg: O(n log n), Worst: O(n^2)",
    "spaceComplexity": "O(log n) call stack",
    "summary": "Fast in-place divide-and-conquer algorithm partitioning elements around a pivot such that smaller elements move left and larger elements move right.",
    "explanation": "Picks an element as pivot (e.g. the last element), rearranges array so that elements smaller than pivot are on its left and larger on its right, then places pivot in its final sorted position and recursively sorts the sub-arrays.",
    "functions": [
      {
        "name": "partition",
        "signature": "int partition(int arr[], int low, int high)",
        "description": "Places pivot in sorted position and partitions sub-array."
      },
      {
        "name": "quickSort",
        "signature": "void quickSort(int arr[], int low, int high)",
        "description": "Recursive divide and conquer quicksort routine."
      }
    ],
    "sampleInputOutput": "Sample Run:\nInput: [10, 80, 30, 90, 40, 50, 70]\nPivot = 70 -> Partitioned -> Recursively sorted.\nOutput: [10, 30, 40, 50, 70, 80, 90]",
    "code": "#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int t = *a;\n    *a = *b;\n    *b = t;\n}\n\nint partition(int arr[], int low, int high) {\n    int pivot = arr[high]; // Pivot chosen as last element\n    int i = (low - 1);\n\n    for (int j = low; j <= high - 1; j++) {\n        if (arr[j] < pivot) {\n            i++;\n            swap(&arr[i], &arr[j]);\n        }\n    }\n    swap(&arr[i + 1], &arr[high]);\n    return (i + 1);\n}\n\nvoid quickSort(int arr[], int low, int high) {\n    if (low < high) {\n        int pi = partition(arr, low, high);\n        quickSort(arr, low, pi - 1);\n        quickSort(arr, pi + 1, high);\n    }\n}\n\nint main() {\n    int n;\n    int arr[100];\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Quick Sort           \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of elements: \");\n    scanf(\"%d\", &n);\n\n    printf(\"Enter %d integers: \", n);\n    for (int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n\n    quickSort(arr, 0, n - 1);\n\n    printf(\"\\nSorted Array: [ \");\n    for (int i = 0; i < n; i++) printf(\"%d%s\", arr[i], (i == n - 1) ? \"\" : \", \");\n    printf(\" ]\\n\");\n\n    return 0;\n}"
  },
  {
    "id": "hash-table-linear-probing",
    "title": "Hash Table Implementation with Linear Probing",
    "filename": "hash_table_linear_probing.c",
    "topic": "Hashing & Other Topics",
    "topicId": "hashing-dma",
    "subtopic": "Hash Tables",
    "difficulty": "Intermediate",
    "operations": [
      "Hash Function Calculation",
      "Insert with Linear Probing",
      "Search Key",
      "Delete Key",
      "Display Table"
    ],
    "timeComplexity": "Search/Insert: O(1) average, O(n) worst-case",
    "spaceComplexity": "O(TABLE_SIZE) fixed array",
    "summary": "Open-addressing Hash Table using modular arithmetic hash function and linear probing to resolve collisions.",
    "explanation": "Maps integer keys to array indices using index = key % TABLE_SIZE. When two distinct keys hash to the same bucket (collision), linear probing sequentially checks the next consecutive slots (index + 1) % TABLE_SIZE until an empty slot is found.",
    "functions": [
      {
        "name": "hashFunction",
        "signature": "int hashFunction(int key)",
        "description": "Computes key % TABLE_SIZE."
      },
      {
        "name": "insertHash",
        "signature": "void insertHash(int table[], int key)",
        "description": "Inserts key with linear collision resolution."
      },
      {
        "name": "searchHash",
        "signature": "int searchHash(const int table[], int key)",
        "description": "Searches for key following the probe sequence."
      }
    ],
    "sampleInputOutput": "Sample Run:\nTable Size = 10\nInsert keys: 15, 25, 35\nHash(15) = 5 -> Placed at 5\nHash(25) = 5 (Collision!) -> Probed to 6\nHash(35) = 5 (Collision!) -> Probed to 7",
    "code": "#include <stdio.h>\n#define TABLE_SIZE 10\n#define EMPTY -1\n#define DELETED -2\n\nvoid initTable(int table[]) {\n    for (int i = 0; i < TABLE_SIZE; i++) table[i] = EMPTY;\n}\n\nint hashFunction(int key) {\n    return key % TABLE_SIZE;\n}\n\nvoid insertHash(int table[], int key) {\n    int index = hashFunction(key);\n    int start = index;\n\n    while (table[index] != EMPTY && table[index] != DELETED) {\n        if (table[index] == key) {\n            printf(\"Key %d already exists at index %d.\\n\", key, index);\n            return;\n        }\n        index = (index + 1) % TABLE_SIZE;\n        if (index == start) {\n            printf(\"Hash Table is completely full! Cannot insert %d.\\n\", key);\n            return;\n        }\n    }\n\n    table[index] = key;\n    printf(\"Inserted key %d at index %d.\\n\", key, index);\n}\n\nint searchHash(const int table[], int key) {\n    int index = hashFunction(key);\n    int start = index;\n\n    while (table[index] != EMPTY) {\n        if (table[index] == key) return index;\n        index = (index + 1) % TABLE_SIZE;\n        if (index == start) break;\n    }\n    return -1;\n}\n\nvoid deleteHash(int table[], int key) {\n    int index = searchHash(table, key);\n    if (index != -1) {\n        table[index] = DELETED;\n        printf(\"Key %d deleted from index %d.\\n\", key, index);\n    } else {\n        printf(\"Key %d not found in hash table.\\n\", key);\n    }\n}\n\nvoid displayTable(const int table[]) {\n    printf(\"\\n--- Hash Table (Size %d) ---\\n\", TABLE_SIZE);\n    for (int i = 0; i < TABLE_SIZE; i++) {\n        if (table[i] == EMPTY) printf(\" [%d] : EMPTY\\n\", i);\n        else if (table[i] == DELETED) printf(\" [%d] : <DELETED>\\n\", i);\n        else printf(\" [%d] : %d\\n\", i, table[i]);\n    }\n}\n\nint main() {\n    int table[TABLE_SIZE];\n    initTable(table);\n    int choice, key, res;\n\n    printf(\"===========================================\\n\");\n    printf(\"  Hash Table (Linear Probing Collision)    \\n\");\n    printf(\"===========================================\\n\");\n\n    do {\n        printf(\"\\n--- Hash Menu ---\\n\");\n        printf(\"1. Insert Key\\n\");\n        printf(\"2. Search Key\\n\");\n        printf(\"3. Delete Key\\n\");\n        printf(\"4. Display Table\\n\");\n        printf(\"5. Exit\\n\");\n        printf(\"Enter choice: \");\n        if (scanf(\"%d\", &choice) != 1) break;\n\n        switch (choice) {\n            case 1:\n                printf(\"Enter integer key to insert: \");\n                scanf(\"%d\", &key);\n                insertHash(table, key);\n                displayTable(table);\n                break;\n            case 2:\n                printf(\"Enter key to search: \");\n                scanf(\"%d\", &key);\n                res = searchHash(table, key);\n                if (res != -1) printf(\"Key %d FOUND at index %d.\\n\", key, res);\n                else printf(\"Key %d NOT found.\\n\", key);\n                break;\n            case 3:\n                printf(\"Enter key to delete: \");\n                scanf(\"%d\", &key);\n                deleteHash(table, key);\n                displayTable(table);\n                break;\n            case 4:\n                displayTable(table);\n                break;\n            case 5:\n                printf(\"Exiting hash table.\\n\");\n                break;\n            default:\n                printf(\"Invalid selection.\\n\");\n        }\n    } while (choice != 5);\n\n    return 0;\n}"
  },
  {
    "id": "dynamic-memory-allocation-dma",
    "title": "Dynamic Memory: malloc, calloc, realloc & free",
    "filename": "dynamic_memory_dma.c",
    "topic": "Hashing & Other Topics",
    "topicId": "hashing-dma",
    "subtopic": "Memory Management",
    "difficulty": "Beginner",
    "operations": [
      "malloc Allocation",
      "calloc Zero-init",
      "realloc Dynamic Expansion",
      "free Memory Leak Prevention"
    ],
    "timeComplexity": "O(1) allocation / O(n) realloc copy",
    "spaceComplexity": "Heap memory",
    "summary": "Demonstrates standard C runtime heap allocation using malloc, zero-initialized calloc, dynamic resizing with realloc, and memory release with free().",
    "explanation": "Dynamic Memory Allocation allows C programs to allocate variable amounts of memory on the heap at runtime instead of fixed stack arrays. malloc allocates uninitialized bytes; calloc allocates and zeroes out all bytes; realloc expands or shrinks existing allocations while preserving current data; free returns memory to the OS.",
    "functions": [
      {
        "name": "demonstrateMalloc",
        "signature": "void demonstrateMalloc(int n)",
        "description": "Allocates heap array with malloc and checks for NULL."
      },
      {
        "name": "demonstrateCalloc",
        "signature": "void demonstrateCalloc(int n)",
        "description": "Allocates zero-initialized heap array with calloc."
      },
      {
        "name": "demonstrateRealloc",
        "signature": "void demonstrateRealloc()",
        "description": "Expands dynamically sized array without data loss."
      }
    ],
    "sampleInputOutput": "Sample Run:\n1. Allocated 3 integers using malloc: [10, 20, 30]\n2. Resized to 5 integers using realloc: [10, 20, 30, 40, 50]\n3. Successfully freed memory blocks to prevent leaks!",
    "code": "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int *ptr = NULL;\n    int n, new_size;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Dynamic Memory (DMA) \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter initial size for dynamic array: \");\n    if (scanf(\"%d\", &n) != 1 || n <= 0) n = 3;\n\n    // 1. Allocate with malloc\n    ptr = (int*)malloc(n * sizeof(int));\n    if (ptr == NULL) {\n        printf(\"Error: malloc failed! Out of memory.\\n\");\n        return 1;\n    }\n    printf(\"\\n[1] Successfully allocated %d integers on heap using malloc().\\n\", n);\n\n    printf(\"Enter %d values: \", n);\n    for (int i = 0; i < n; i++) {\n        scanf(\"%d\", &ptr[i]);\n    }\n\n    printf(\"Current array elements: [ \");\n    for (int i = 0; i < n; i++) printf(\"%d%s\", ptr[i], (i == n - 1) ? \"\" : \", \");\n    printf(\" ]\\n\");\n\n    // 2. Expand array using realloc\n    printf(\"\\nEnter new expanded size (greater than %d): \", n);\n    if (scanf(\"%d\", &new_size) != 1 || new_size <= n) new_size = n + 2;\n\n    int *new_ptr = (int*)realloc(ptr, new_size * sizeof(int));\n    if (new_ptr == NULL) {\n        printf(\"Error: realloc failed! Freeing original.\\n\");\n        free(ptr);\n        return 1;\n    }\n    ptr = new_ptr; // Update pointer\n    printf(\"[2] Reallocated memory from %d to %d elements using realloc().\\n\", n, new_size);\n\n    printf(\"Enter %d additional values: \", new_size - n);\n    for (int i = n; i < new_size; i++) {\n        scanf(\"%d\", &ptr[i]);\n    }\n\n    printf(\"Expanded array: [ \");\n    for (int i = 0; i < new_size; i++) printf(\"%d%s\", ptr[i], (i == new_size - 1) ? \"\" : \", \");\n    printf(\" ]\\n\");\n\n    // 3. Free memory\n    free(ptr);\n    ptr = NULL;\n    printf(\"\\n[3] Memory freed successfully using free(). Pointer set to NULL.\\n\");\n\n    return 0;\n}"
  },
  {
    "id": "recursion-tower-of-hanoi",
    "title": "Recursion: Tower of Hanoi with Disk Movement Step Tracking",
    "filename": "tower_of_hanoi.c",
    "topic": "Recursion",
    "topicId": "recursion",
    "subtopic": "Recursion & Backtracking",
    "difficulty": "Beginner",
    "operations": [
      "Recursive Step Calculation",
      "Move Tracing",
      "Total Moves Formula (2^n - 1)"
    ],
    "timeComplexity": "O(2^n)",
    "spaceComplexity": "O(n) recursive call stack",
    "summary": "Classic recursive problem moving n disks from source peg to destination peg using an auxiliary peg following strict size constraints.",
    "explanation": "Rules: (1) Only one disk can be moved at a time. (2) Each move consists of taking the upper disk from one of the stacks and placing it on top of another stack. (3) No disk may be placed on top of a smaller disk. Total moves required for n disks is exactly 2^n - 1.",
    "functions": [
      {
        "name": "towerOfHanoi",
        "signature": "void towerOfHanoi(int n, char from_rod, char to_rod, char aux_rod, int *step)",
        "description": "Recursively outputs disk movements."
      }
    ],
    "sampleInputOutput": "Sample Run:\nEnter number of disks: 3\nStep 1: Move disk 1 from rod A to rod C\nStep 2: Move disk 2 from rod A to rod B\nStep 3: Move disk 1 from rod C to rod B\nStep 4: Move disk 3 from rod A to rod C\nStep 5: Move disk 1 from rod B to rod A\nStep 6: Move disk 2 from rod B to rod C\nStep 7: Move disk 1 from rod A to rod C\nTotal moves: 7 (2^3 - 1 = 7)",
    "code": "#include <stdio.h>\n#include <math.h>\n\nvoid towerOfHanoi(int n, char from_rod, char to_rod, char aux_rod, int *step) {\n    if (n == 1) {\n        (*step)++;\n        printf(\"Step %2d: Move disk 1 from rod %c to rod %c\\n\", *step, from_rod, to_rod);\n        return;\n    }\n    // Move n-1 disks from source to aux, using destination as helper\n    towerOfHanoi(n - 1, from_rod, aux_rod, to_rod, step);\n\n    // Move nth disk from source to destination\n    (*step)++;\n    printf(\"Step %2d: Move disk %d from rod %c to rod %c\\n\", *step, n, from_rod, to_rod);\n\n    // Move n-1 disks from aux to destination, using source as helper\n    towerOfHanoi(n - 1, aux_rod, to_rod, from_rod, step);\n}\n\nint main() {\n    int n, step = 0;\n\n    printf(\"===========================================\\n\");\n    printf(\"  CodeSphere DSA Lab: Tower of Hanoi       \\n\");\n    printf(\"===========================================\\n\");\n\n    printf(\"Enter number of disks (e.g. 3 or 4): \");\n    if (scanf(\"%d\", &n) != 1 || n <= 0) n = 3;\n\n    printf(\"\\nSolution steps to move %d disks from Rod A to Rod C:\\n\", n);\n    printf(\"---------------------------------------------------\\n\");\n\n    towerOfHanoi(n, 'A', 'C', 'B', &step);\n\n    printf(\"---------------------------------------------------\\n\");\n    printf(\"Total moves required: %d (Formula: 2^%d - 1 = %.0f)\\n\", step, n, pow(2, n) - 1);\n\n    return 0;\n}"
  },
  {
    "id": "strings-core-operations",
    "title": "String Processing: Length, Reversal, Palindrome & Pattern Search",
    "filename": "string_operations.c",
    "topic": "Strings",
    "topicId": "strings",
    "subtopic": "Character Arrays & Pointers",
    "difficulty": "Beginner",
    "operations": [
      "String Length Calculation",
      "String Reversal (Two-pointer in-place)",
      "Palindrome Check",
      "String Concatenation",
      "Substring Pattern Matching"
    ],
    "timeComplexity": "O(n) for length/reverse/concat, O(n*m) for pattern search",
    "spaceComplexity": "O(1) Auxiliary",
    "summary": "Comprehensive C character array and string processing library implementing user-defined functions without relying solely on string.h for algorithmic understanding.",
    "explanation": "Strings in C are one-dimensional character arrays terminated by a null byte ('\\0'). This program demonstrates standard algorithm implementations for finding string lengths via pointer arithmetic, two-pointer in-place string reversal, palindrome detection, string concatenation buffer handling, and brute-force substring pattern search.",
    "functions": [
      {
        "name": "strLength",
        "signature": "int strLength(const char *str)",
        "description": "Counts characters until null terminator is reached."
      },
      {
        "name": "strReverse",
        "signature": "void strReverse(char *str)",
        "description": "Reverses characters in-place using two-pointer swap approach."
      },
      {
        "name": "isPalindrome",
        "signature": "int isPalindrome(const char *str)",
        "description": "Checks if string reads the same forwards and backwards."
      },
      {
        "name": "strConcat",
        "signature": "void strConcat(char *dest, const char *src)",
        "description": "Appends source string to destination buffer with null termination."
      },
      {
        "name": "findSubstring",
        "signature": "int findSubstring(const char *str, const char *sub)",
        "description": "Finds the first index of sub in str or returns -1."
      }
    ],
    "sampleInputOutput": "=== String Processing Library ===\nInput string: 'level'\nLength: 5\nIs Palindrome: YES (1)\nReversed: 'level'\nConcatenating 'level' + ' up': 'level up'\nPattern 'up' found at index: 6\n\n[Program finished with exit code 0]",
    "code": "#include <stdio.h>\n\n// User-defined string functions\nint strLength(const char *str) {\n    int len = 0;\n    while (str[len] != '\\0') {\n        len++;\n    }\n    return len;\n}\n\nvoid strCopy(char *dest, const char *src) {\n    int i = 0;\n    while (src[i] != '\\0') {\n        dest[i] = src[i];\n        i++;\n    }\n    dest[i] = '\\0';\n}\n\nvoid strReverse(char *str) {\n    int left = 0;\n    int right = strLength(str) - 1;\n    while (left < right) {\n        char temp = str[left];\n        str[left] = str[right];\n        str[right] = temp;\n        left++;\n        right--;\n    }\n}\n\nint isPalindrome(const char *str) {\n    int left = 0;\n    int right = strLength(str) - 1;\n    while (left < right) {\n        if (str[left] != str[right]) {\n            return 0; // Not a palindrome\n        }\n        left++;\n        right--;\n    }\n    return 1; // Palindrome\n}\n\nvoid strConcat(char *dest, const char *src) {\n    int destLen = strLength(dest);\n    int i = 0;\n    while (src[i] != '\\0') {\n        dest[destLen + i] = src[i];\n        i++;\n    }\n    dest[destLen + i] = '\\0';\n}\n\nint findSubstring(const char *str, const char *sub) {\n    int n = strLength(str);\n    int m = strLength(sub);\n    for (int i = 0; i <= n - m; i++) {\n        int j = 0;\n        while (j < m && str[i + j] == sub[j]) {\n            j++;\n        }\n        if (j == m) return i; // Matched index\n    }\n    return -1; // Not found\n}\n\nint main() {\n    char str1[100] = \"level\";\n    char str2[100] = \" up\";\n    char buffer[200];\n\n    printf(\"=== String Processing Library ===\\n\");\n    printf(\"Input string: '%s'\\n\", str1);\n    printf(\"Length: %d\\n\", strLength(str1));\n    printf(\"Is Palindrome: %s (%d)\\n\", isPalindrome(str1) ? \"YES\" : \"NO\", isPalindrome(str1));\n\n    strCopy(buffer, str1);\n    strReverse(buffer);\n    printf(\"Reversed: '%s'\\n\", buffer);\n\n    strCopy(buffer, str1);\n    strConcat(buffer, str2);\n    printf(\"Concatenating '%s' + '%s': '%s'\\n\", str1, str2, buffer);\n\n    int pos = findSubstring(buffer, \"up\");\n    printf(\"Pattern 'up' found at index: %d\\n\", pos);\n\n    return 0;\n}\n"
  }
];
