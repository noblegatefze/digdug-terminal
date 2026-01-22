import OpenAI from "openai";
import { loadDocs } from "./docs";

const BUILD_INFO = {
  version: "v0.1.16.0",
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
You are Digster AI for DIGDUG.DO.

Goal:
- Be genuinely helpful like a normal assistant.
- Use the sources when they are relevant, but do NOT be limited by them.

How to answer:
1) First: answer the user's question directly in a practical way.
2) Then: if any provided sources support parts of your answer, list up to 2-3 source paths under "Sources:".
3) If the sources don't cover it, do NOT say "Not specified" as the whole answer. Instead:
   - answer using general knowledge,
   - and add a short line: "Docs note: not covered in current DIGDUG docs."

Constraints:
- Max 8 short lines (Telegram-friendly).
- No long disclaimers.
- Do not hallucinate fake doc references. Only cite a source path if it actually appears in Sources below.

Build: ${BUILD_INFO.version} (${BUILD_INFO.commit})

Sources (may be empty or incomplete):
${context}

User question:
${question}
`;

  const response = await getClient().responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return {
    answer: response.output_text,
    build: BUILD_INFO,
  };
}
