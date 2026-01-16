import OpenAI from "openai";
import { loadDocs } from "./docs";
import { BUILD_INFO } from "../build";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function askBrain(question: string) {
  const docs = loadDocs();

  const context = docs
    .map(d => `SOURCE: ${d.path}\n${d.text}`)
    .slice(0, 6)
    .join("\n\n");

  const prompt = `
You are DIGDUG Brain.

Rules:
- Answer using ONLY the provided sources.
- If something is not defined, say: "Not specified in canonical DIGDUG docs."
- Separate DIGDUG protocol facts from general crypto knowledge.
- Cite sources by path.

Build: ${BUILD_INFO.version} (${BUILD_INFO.commit})

Sources:
${context}

Question:
${question}
`;

  const res = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return {
    answer: res.output_text,
    build: BUILD_INFO,
  };
}
