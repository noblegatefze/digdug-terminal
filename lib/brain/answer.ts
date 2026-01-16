import OpenAI from "openai";
import { loadDocs } from "./docs";

const BUILD_INFO = {
  version: "v0.1.15.0",
  commit: process.env.VERCEL_GIT_COMMIT_SHA || "local",
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
You are DIGDUG Brain.

Rules:
- Answer using ONLY the provided sources.
- If something is not defined, say: "Not specified in canonical DIGDUG docs."
- Separate DIGDUG protocol facts from general crypto knowledge.
- Cite sources by path.
- Be concise.

Build: ${BUILD_INFO.version} (${BUILD_INFO.commit})

Sources:
${context}

Question:
${question}
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return {
    answer: response.output_text,
    build: BUILD_INFO,
  };
}
