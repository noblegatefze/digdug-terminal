import fs from "fs";
import path from "path";

export type DocChunk = {
  path: string;
  text: string;
};

function collectMarkdownFrom(root: string): DocChunk[] {
  const chunks: DocChunk[] = [];
  if (!fs.existsSync(root)) return chunks;

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) {
        const text = fs.readFileSync(full, "utf8");
        chunks.push({
          path: full.replace(process.cwd(), ""),
          text,
        });
      }
    }
  }

  walk(root);
  return chunks;
}

export function loadDocs(): DocChunk[] {
  // 1) Canonical long-form docs (submodule)
  const whitepaperRoot = path.join(process.cwd(), "whitepaper");

  // 2) Canonical build facts (in app repo)
  const buildFactsRoot = path.join(process.cwd(), "docs");

  const docs = [
    ...collectMarkdownFrom(buildFactsRoot),
    ...collectMarkdownFrom(whitepaperRoot),
  ];

  return docs;
}
