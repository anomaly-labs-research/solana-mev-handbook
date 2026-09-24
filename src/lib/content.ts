import fs from "node:fs/promises";
import path from "node:path";
import { renderMarkdown, type RenderedDoc } from "./markdown";
import { getDocMeta, routeForMarkdownFile, type DocMeta } from "./manifest";

export * from "./manifest";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type LoadedDoc = DocMeta & RenderedDoc;

export async function loadDoc(slug: string): Promise<LoadedDoc | null> {
  const meta = getDocMeta(slug);
  if (!meta) return null;
  const raw = await fs.readFile(path.join(CONTENT_DIR, meta.file), "utf8");
  const rendered = await renderMarkdown(raw, routeForMarkdownFile);
  return { ...meta, ...rendered };
}
