import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export type ExplanationMode =
  | "complete"
  | "line_by_line"
  | "logic"
  | "algorithm"
  | "complexity"
  | "bugs"
  | "improvements"
  | "beginner";

const MODE_PROMPTS: Record<ExplanationMode, string> = {
  complete: `Provide a comprehensive analysis of this C program.
Format your response with the following sections:
### 1. Overview & Purpose
High-level description of what the program accomplishes.

### 2. Step-by-Step Logic
Detailed breakdown of how the program executes from main() to completion.

### 3. Key Data Structures & Variables
Explanation of pointers, arrays, structs, and variables.

### 4. Algorithm & Complexity Analysis
- Name of Algorithm (if applicable):
- Time Complexity (Best, Average, Worst with exact Big-O justification):
- Space Complexity (Auxiliary memory):

### 5. Potential Bugs & Edge Cases
Any memory leaks, buffer overflows, or unhandled conditions.`,

  line_by_line: `Provide a line-by-line pedagogical walkthrough of this C program. Explain what each significant statement does, including pointer dereferencing, memory allocation, and condition branches.`,

  logic: `Focus deeply on the underlying control flow, data flow, and problem-solving logic in this C program. Use clear bullet points and explain the purpose behind each logic branch.`,

  algorithm: `Analyze the algorithm implemented in this C program (e.g. sorting, recursion, tree traversal, linked list mutation). Explain the algorithmic strategy (Divide & Conquer, Greedy, DP, Two Pointers) and provide exact Big-O Time and Space complexities.`,

  complexity: `Perform a rigorous Time and Space Complexity analysis of this C program.
- Time Complexity: Explain operations in loops, recursive calls, and total operations.
- Space Complexity: Explain stack frame depth, heap allocations (malloc/calloc), and auxiliary storage.`,

  bugs: `Analyze this C code for potential bugs, security vulnerabilities, undefined behaviors, memory leaks (unfreed mallocs), off-by-one errors, null pointer dereferences, or buffer overflows. Suggest exact fixes.`,

  improvements: `Suggest clean, idiomatic C improvements: modern C11 best practices, performance optimizations, memory safety, and readability enhancements.`,

  beginner: `Explain this C code in beginner-friendly, simple terms using clear real-world analogies. Avoid intimidating jargon and explain pointers and memory like mailboxes and street addresses.`,
};

export async function explainCode(code: string, mode: ExplanationMode = "complete") {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(key);
  const models = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-3.1-pro-preview"];

  const prompt = `You are CodeSphere AI, an expert C programming and Data Structures & Algorithms educator.
Target Audience: Computer science students and DSA learners.

${MODE_PROMPTS[mode] || MODE_PROMPTS.complete}

Here is the C program source code:
\`\`\`c
${code}
\`\`\`

Provide an insightful, accurately formatted Markdown response.`;

  let lastError: Error | null = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("Failed to get explanation from AI models.");
}
