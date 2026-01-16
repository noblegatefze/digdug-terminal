import fs from "fs";
import path from "path";

const DOC_ROOT = path.join(process.cwd(), "whitepaper");

export type DocChunk = {
  path: string;
  text: string;
};

export function loadDocs(): DocChunk[] {
  const chunks: DocChunk[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.endsWith(".md")) {
        const text = fs.readFileSync(full, "utf8");
        chunks.push({
          path: full.replace(process.cwd(), ""),
          text,
        });
      }
    }
  }

  walk(DOC_ROOT);
  return chunks;
}
