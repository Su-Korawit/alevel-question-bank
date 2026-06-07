import type { Subject } from './config.js';

export const SYSTEM_INSTRUCTION = `You are a precise exam question extractor for Thai university entrance exams (A-Level/TCAS).
Your job is to extract all multiple-choice questions from the provided PDF and return them as a JSON array.

Critical rules:
- Return ONLY a valid JSON array. No markdown code fences, no surrounding text, no explanations.
- Preserve Thai text exactly as written in the PDF.
- Use LaTeX notation for ALL mathematical expressions.
- If you cannot confidently determine a field, use null.`;

export function buildUserMessage(subject: Subject, year: string): string {
  return `Extract ALL multiple-choice questions from the attached PDF.

Subject: ${subject} | Year: ${year} (Buddhist Era)

Return a JSON array where each element has this exact structure:
{
  "number": <integer — the question number as printed in the exam>,
  "questionText": "<full question stem in Thai or English exactly as written. Wrap ALL math in LaTeX: inline with $...$ and display/block with $$...$$>",
  "choices": {
    "A": "<choice text, with LaTeX for any math>",
    "B": "<choice text>",
    "C": "<choice text>",
    "D": "<choice text>",
    "E": "<choice text or null if not present>"
  },
  "correctAnswer": "<one of: A, B, C, D, E>",
  "hasImage": <true if the question has a diagram, graph, figure, or image — false otherwise>,
  "pageNumber": <integer — 1-indexed page where this question appears>,
  "explanation": "<one sentence explaining why the answer is correct, or null>"
}

LaTeX formatting rules (follow strictly):
- Fractions: \\frac{numerator}{denominator}
- Square roots: \\sqrt{expression}
- Powers/superscripts: x^{2} (always use braces)
- Subscripts: x_{n} (always use braces)
- Greek letters: \\alpha \\beta \\gamma \\theta \\pi \\sigma \\omega
- Absolute value: |x| or \\left|x\\right|
- Multiplication: \\times or \\cdot
- Inequalities: \\leq \\geq \\neq
- Infinity: \\infty

Rules:
1. Do NOT skip any question — extract every question visible in the PDF.
2. Number questions exactly as they appear (question 1 → number: 1).
3. If a question has only 4 choices (A–D), set "E" to null.
4. Set hasImage to true if there is ANY figure, graph, geometric diagram, or image associated with the question.
5. Return ONLY the JSON array. No markdown fences. No prefix or suffix text of any kind.`;
}
