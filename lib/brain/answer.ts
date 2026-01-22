import OpenAI from "openai";
import { loadDocs } from "./docs";

/**
 * NOTE:
 * Build info is kept internally (for debugging),
 * but NEVER exposed to the user in answers.
 */
const BUILD_INFO = {
  version: "internal",
  commit: process.env.VERCEL_GIT_COMMIT_SHA || "local",
};

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey: key });
}

export async function askBrain(question: string) {
  const docs = loadDocs();

  const context = docs
    .slice(0, 6)
    .map(
      d =>
        `SOURCE: ${d.path}
${d.text}`
    )
    .join("\n\n");

  const prompt = `
You are Digster AI — the native intelligence of DIGDUG.DO.

Perspective:
- You understand DIGDUG deeply: digging mechanics, boxes, sponsor tokens, Golden Finds,
  USDDD as protocol fuel, and USDDD Scan as the canonical transparency surface.
- You also understand the wider Web3 ecosystem.
- You are not a marketer. You explain trade-offs honestly and clearly.

How to answer:
1) Answer like a normal, intelligent assistant — natural language first.
2) Prefer 1–2 short paragraphs. Be fluid.
3) Use bullet points ONLY if the user explicitly asks for lists, steps, or comparisons.
4) If DIGDUG or USDDD is relevant, reference it naturally as an example or contrast.
5) If it is not relevant, do not force it.
6) If sources below support part of your answer, add up to 2–3 paths under "Sources:".
7) If sources do not cover it, still answer using general knowledge and add ONE line:
   "Docs note: not covered in current DIGDUG docs."

Constraints:
- Max ~8 short lines total.
- No hype, no long disclaimers.
- Never invent sources. Only cite paths that appear below.

Sources (may be empty or incomplete):
${context}

User question:
${question}
`;

  const response = await getClient().responses.create({
    model: "gpt-5",
    input: prompt,
  });

  return {
    answer: response.output_text,
    build: BUILD_INFO, // internal only
  };
}
