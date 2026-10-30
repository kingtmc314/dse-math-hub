#!/usr/bin/env node
/**
 * Generate original, Chinese step-by-step solutions for the scanned 2026 DSE
 * Mathematics Paper 2. The generated answer is checked against local P2 data.
 *
 * Usage:
 *   manus-node "/home/ubuntu/dse-math-hub/scripts/generate_2026_mc_solutions.mjs" --pages 2
 *   manus-node "/home/ubuntu/dse-math-hub/scripts/generate_2026_mc_solutions.mjs" --pages 2-15 --workers 3
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { LlmClient, mapLimit, messageText } = await import(
  pathToFileURL("/home/ubuntu/skills/builtin-llm-models/lib/llm.mjs").href,
);

const ROOT = "/home/ubuntu/dse-math-hub";
const SCAN_DIR = "/home/ubuntu/dse-math-assets/2026-p2-pages";
const OUTPUT_DIR = "/home/ubuntu/dse-math-assets/2026-generated-solutions";
const MODEL = "gpt-6.1-sol";

function readArg(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

function parsePages(spec) {
  if (!spec) throw new Error("Use --pages 2-15 or --pages 2,3,4");
  const pages = new Set();
  for (const part of spec.split(",")) {
    const range = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!range) throw new Error(`Invalid page range: ${part}`);
    const from = Number(range[1]);
    const to = Number(range[2] ?? range[1]);
    if (from > to || from < 2 || to > 15) throw new Error(`Page range outside 2-15: ${part}`);
    for (let page = from; page <= to; page += 1) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

const pages = parsePages(readArg("--pages"));
const workerCount = Math.max(1, Math.min(4, Number(readArg("--workers", "2"))));
const dseData = JSON.parse(await readFile(path.join(ROOT, "client/src/data/dseData.json"), "utf8"));
const answerByQuestion = Object.fromEntries(
  dseData.paper2["2026"].map((item) => [String(item.q), item.ans]),
);

const responseSchema = {
  name: "page_solutions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      page: { type: "integer" },
      solutions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            q: { type: "integer" },
            answer: { type: "string", enum: ["A", "B", "C", "D"] },
            solution_text: { type: "string" },
            latex: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["q", "answer", "solution_text", "latex"],
          additionalProperties: false,
        },
      },
    },
    required: ["page", "solutions"],
    additionalProperties: false,
  },
};

function validatePageResult(result, page) {
  if (result.page !== page) throw new Error(`Response page mismatch: expected ${page}, got ${result.page}`);
  if (!Array.isArray(result.solutions) || result.solutions.length === 0) {
    throw new Error(`No solutions were returned for page ${page}`);
  }

  const seen = new Set();
  for (const solution of result.solutions) {
    if (!Number.isInteger(solution.q) || solution.q < 1 || solution.q > 45) {
      throw new Error(`Invalid question number on page ${page}: ${solution.q}`);
    }
    if (seen.has(solution.q)) throw new Error(`Duplicate Q${solution.q} on page ${page}`);
    seen.add(solution.q);
    const expected = answerByQuestion[String(solution.q)];
    if (!expected) throw new Error(`No local answer key for Q${solution.q}`);
    if (solution.answer !== expected) {
      throw new Error(`Answer mismatch on Q${solution.q}: generated ${solution.answer}, expected ${expected}`);
    }
    if (!solution.solution_text.trim() && solution.latex.length === 0) {
      throw new Error(`Empty solution content for Q${solution.q}`);
    }
  }
  return result;
}

async function generatePage(page) {
  const imagePath = path.join(SCAN_DIR, `page-${String(page).padStart(2, "0")}.png`);
  const image = (await readFile(imagePath)).toString("base64");
  const answerKey = Object.entries(answerByQuestion)
    .map(([q, answer]) => `Q${q}: ${answer}`)
    .join(", ");

  const response = await new LlmClient({ timeoutMs: 300000, maxRetries: 3 }).chat({
    model: MODEL,
    reasoning: { effort: "high" },
    max_completion_tokens: 12000,
    response_format: { type: "json_schema", json_schema: responseSchema },
    messages: [
      {
        role: "system",
        content: "You are a meticulous Hong Kong DSE Mathematics teacher. You write accurate, original explanations in Traditional Chinese. Your task is to solve questions from the supplied scanned examination page; do not copy or quote any external solution source. Preserve mathematical accuracy over brevity.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `This is page ${page} of the uploaded 2026 HKDSE Mathematics Compulsory Part Paper 2 scan. Identify every complete numbered multiple-choice question visibly present on this page. For each such question, return an original, self-contained, step-by-step Traditional Chinese solution.\n\nUse the local answer key solely to verify your calculation, never as a substitute for reasoning: ${answerKey}\n\nRequirements:\n- Include only question numbers actually visible on this page; do not invent or omit a visible complete question.\n- Derive the result independently from the question image, including any diagram.\n- State the decisive reasoning in solution_text, and put display-ready LaTex bodies (without $$ delimiters) in latex.\n- Conclude clearly with why the result corresponds to the specified option.\n- Do not reproduce the full problem wording.\n- If a question needs a diagram, describe the essential relation used so the solution remains understandable.\n- Ensure every returned answer matches the local answer key before responding.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${image}`, detail: "high" },
          },
        ],
      },
    ],
  });

  const result = validatePageResult(JSON.parse(messageText(response)), page);
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, `page-${String(page).padStart(2, "0")}.json`), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

const results = await mapLimit(pages, workerCount, async (page) => {
  try {
    const result = await generatePage(page);
    return { page, questions: result.solutions.map((solution) => solution.q), error: null };
  } catch (error) {
    return { page, questions: [], error: error instanceof Error ? error.message : String(error) };
  }
});

console.log(JSON.stringify({ model: MODEL, pages: results }, null, 2));
if (results.some((result) => result.error)) process.exitCode = 1;
