// Prints, per doc and reading mode, which H2 sections are visible and what share of the words.
// Usage: bun run scripts/mode-report.ts [slug ...]
import fs from "node:fs/promises";
import path from "node:path";
import { DOCS, routeForMarkdownFile } from "../src/lib/manifest";
import { renderMarkdown } from "../src/lib/markdown";
import { MODES, type Mode } from "../src/lib/modes";

const wanted = process.argv.slice(2);
const words = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

/** Drop every mode-block whose data-modes lacks `mode`, nested ones included. */
function visibleHtml(html: string, mode: Mode): string {
  const open = /<div class="mode-block" data-modes="([^"]*)">/g;
  let out = "";
  let i = 0;
  for (;;) {
    open.lastIndex = i;
    const m = open.exec(html);
    if (!m) return out + html.slice(i);
    out += html.slice(i, m.index);
    // Find the matching close tag by counting nested divs.
    let depth = 1;
    let j = m.index + m[0].length;
    const tag = /<div\b|<\/div>/g;
    tag.lastIndex = j;
    for (let t = tag.exec(html); t && depth > 0; t = tag.exec(html)) {
      depth += t[0] === "<div" || t[0] === "<div " ? 1 : -1;
      j = t.index + t[0].length;
    }
    const inner = html.slice(m.index + m[0].length, j - "</div>".length);
    if (m[1].split(" ").includes(mode)) out += visibleHtml(inner, mode);
    i = j;
  }
}

for (const doc of DOCS) {
  if (wanted.length && !wanted.includes(doc.slug) && !wanted.includes(doc.file)) continue;
  const raw = await fs.readFile(path.join("content", doc.file), "utf8");
  const r = await renderMarkdown(raw, routeForMarkdownFile);
  const total = words(r.html);
  console.log(`\n== ${doc.file} (${total} words, ${r.unverified} unverified)`);
  for (const m of MODES) {
    const shown = r.toc.filter((e) => e.depth === 2 && e.modes.includes(m.id)).map((e) => e.text);
    const pct = Math.round((100 * words(visibleHtml(r.html, m.id))) / total);
    console.log(`  ${m.id.padEnd(12)} ${String(pct).padStart(3)}% of words, ${shown.length} sections: ${shown.join(" | ")}`);
  }
}
