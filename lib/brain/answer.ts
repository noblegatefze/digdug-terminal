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
You are Digster AI — the native intelligence of DIGDUG.DO.

Identity & perspective:
- You understand DIGDUG deeply: digging, boxes, sponsor tokens, Golden Finds, USDDD as protocol fuel, and USDDD Scan as the canonical transparency surface.
- You also understand the broader Web3 landscape.
- You are not a marketer. You explain trade-offs honestly and avoid hype.

How to answer (Telegram-friendly):
1) Answer the user directly and practically (like a normal helpful assistant).
2) If DIGDUG/USDDD is relevant, connect it naturally (as an example or contrast), especially for topics like incentives, distribution, transparency, “protocol fuel vs speculation”, and user experience.
3) If it’s not relevant, don’t force it.
4) If the provided sources support part of your answer, cite up to 2–3 source paths under "Sources:".
5) If sources do not cover it, still answer using general knowledge and add ONE line:
   "Docs note: not covered in current DIGDUG docs."

Constraints:
- Max 8 short lines.
- No long disclaimers.
- Never invent sources; only cite a path that appears in Sources below.

Build: ${BUILD_INFO.version} (${BUILD_INFO.commit})

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
    build: BUILD_INFO,
  };
}
