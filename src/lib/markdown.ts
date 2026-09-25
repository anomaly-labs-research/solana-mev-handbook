import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot, RootContent, Heading, Link, Paragraph, Parent } from "mdast";
import type { Root as HastRoot, Element, Text } from "hast";
import type { Options as RehypeOptions } from "remark-rehype";
import { MODE_IDS, isMode, modesFromLevel, type Mode } from "./modes";

export type TocEntry = { id: string; text: string; depth: 2 | 3; modes: Mode[] };

export type RenderedDoc = {
  /** Body HTML with the leading H1 and "As of" line removed. */
  html: string;
  /** Title taken from the first H1, falling back to the manifest title. */
  h1?: string;
  /** The italic "_As of Sep 2026._" line, if present. */
  asOf?: string;
  toc: TocEntry[];
  /** Number of "(unverified)" markers, shown as a hint on the page. */
  unverified: number;
};

type LinkRewriter = (href: string) => string | null;

/** Pull the H1 and the "As of" line out of the tree so the page can render them as a header. */
function remarkExtractFrontMatter(store: RenderedDoc) {
  return (tree: MdastRoot) => {
    const keep: MdastRoot["children"] = [];
    let seenH1 = false;
    for (const node of tree.children) {
      if (!seenH1 && node.type === "heading" && (node as Heading).depth === 1) {
        store.h1 = toString(node);
        seenH1 = true;
        continue;
      }
      // Accept both `_As of …_` and an unterminated `_As of …` (a common typo).
      if (store.asOf === undefined && node.type === "paragraph") {
        const text = toString(node).trim();
        const kids = (node as Paragraph).children;
        const italic = kids.length === 1 && kids[0].type === "emphasis" && /^as of/i.test(text);
        const bare = /^_as of [^_\n]*$/i.test(text);
        if (italic || bare) {
          store.asOf = text.replace(/^_/, "").replace(/\.$/, "");
          continue;
        }
      }
      keep.push(node);
    }
    tree.children = keep;
  };
}

/** Relative `*.md` links between docs become routes; everything else is left alone. */
function remarkRewriteLinks(rewrite: LinkRewriter) {
  return (tree: MdastRoot) => {
    visit(tree, "link", (node: Link) => {
      if (/^[a-z]+:/i.test(node.url) || node.url.startsWith("#")) return;
      if (!/\.md(#|$)/.test(node.url)) return;
      const route = rewrite(node.url);
      if (route) node.url = route;
    });
  };
}


/** A run of blocks shown only in some reading modes. Produced from the comment markers below. */
interface ModeBlock extends Parent {
  type: "modeBlock";
  modes: Mode[];
  children: RootContent[];
}

declare module "mdast" {
  interface RootContentMap {
    modeBlock: ModeBlock;
  }
}

const OPEN_MARKER = /^<!--\s*(level|only)\s*:\s*([a-z ,]+?)\s*-->$/i;
const CLOSE_MARKER = /^<!--\s*\/\s*(level|only)\s*-->$/i;

type Marker = { kind: "level" | "only"; modes: Mode[] };

function openMarker(node: RootContent): Marker | null {
  if (node.type !== "html") return null;
  const m = OPEN_MARKER.exec(node.value.trim());
  if (!m) return null;
  const kind = m[1].toLowerCase() as Marker["kind"];
  const names = m[2].split(",").map((n) => n.trim().toLowerCase()).filter(isMode);
  if (names.length === 0) return null;
  return { kind, modes: kind === "level" ? modesFromLevel(names[0]) : names };
}

function closeMarker(node: RootContent): Marker["kind"] | null {
  if (node.type !== "html") return null;
  const m = CLOSE_MARKER.exec(node.value.trim());
  return m ? (m[1].toLowerCase() as Marker["kind"]) : null;
}

/**
 * Markers in the markdown: `<!-- level: expert -->` (that mode and deeper) or
 * `<!-- only: beginner -->` (exactly those). Right after a heading, a marker covers that whole
 * section and needs no closer. Anywhere else it runs to its `<!-- /level -->` or `<!-- /only -->`,
 * or to the next heading if there is none. Blocks nest.
 */
function groupModeBlocks(nodes: RootContent[]): RootContent[] {
  const out: RootContent[] = [];
  let i = 0;
  while (i < nodes.length) {
    const marker = openMarker(nodes[i]);
    if (!marker) {
      if (!closeMarker(nodes[i])) out.push(nodes[i]);
      i += 1;
      continue;
    }
    const prev = out[out.length - 1];
    const heading = prev && prev.type === "heading" ? prev : null;
    // Find the matching closer, skipping nested blocks of the same kind that will take their own.
    let depth = 0;
    let closer = -1;
    let sectionEnd = nodes.length;
    for (let k = i + 1; k < nodes.length; k += 1) {
      const n = nodes[k];
      const open = openMarker(n);
      if (open) {
        if (open.kind === marker.kind && nodes[k - 1].type !== "heading") depth += 1;
        continue;
      }
      if (closeMarker(n) === marker.kind) {
        if (depth === 0) {
          closer = k;
          break;
        }
        depth -= 1;
        continue;
      }
      if (n.type === "heading" && sectionEnd === nodes.length) {
        if (!heading) sectionEnd = k;
        else if (n.depth <= heading.depth) {
          sectionEnd = k;
          break;
        }
      }
    }
    const end = closer >= 0 && (!heading || closer < sectionEnd) ? closer : sectionEnd;
    const inner: RootContent[] = heading ? [out.pop() as RootContent] : [];
    inner.push(...groupModeBlocks(nodes.slice(i + 1, end)));
    out.push({ type: "modeBlock", modes: marker.modes, children: inner });
    i = end === closer ? end + 1 : end;
  }
  return out;
}

function remarkModeBlocks() {
  return (tree: MdastRoot) => {
    tree.children = groupModeBlocks(tree.children);
  };
}

type Handler = NonNullable<NonNullable<RehypeOptions["handlers"]>[keyof NonNullable<RehypeOptions["handlers"]>]>;

/** hast output for a mode block; the `data-modes` attribute drives the CSS. */
const modeBlockHandler: Handler = (state, node: ModeBlock): Element => ({
  type: "element",
  tagName: "div",
  properties: { className: ["mode-block"], dataModes: node.modes.join(" ") },
  children: state.all(node),
});

/** Same slugger rules as rehype-slug, so TOC ids match the rendered headings. */
function remarkToc(store: RenderedDoc) {
  return (tree: MdastRoot) => {
    const slugger = new GithubSlugger();
    const walk = (nodes: RootContent[], modes: Mode[]) => {
      for (const node of nodes) {
        if (node.type === "heading" && (node.depth === 2 || node.depth === 3)) {
          const text = toString(node);
          store.toc.push({ id: slugger.slug(text), text, depth: node.depth, modes });
        } else if (node.type === "modeBlock") {
          walk(node.children, modes.filter((m) => node.modes.includes(m)));
        }
      }
    };
    walk(tree.children, MODE_IDS);
  };
}

/** Tables scroll horizontally; external links open in a new tab; any "(… unverified …)" gets a badge. */
function rehypePolish(store: RenderedDoc) {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "table" && parent && typeof index === "number") {
        const wrapper: Element = {
          type: "element",
          tagName: "div",
          properties: { className: ["table-wrap"] },
          children: [node],
        };
        parent.children[index] = wrapper;
        return;
      }
      if (node.tagName === "a") {
        const href = String(node.properties?.href ?? "");
        if (/^https?:/i.test(href)) {
          node.properties = { ...node.properties, target: "_blank", rel: ["noopener", "noreferrer"] };
        }
      }
    });
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if ((parent as Element).tagName === "code" || (parent as Element).tagName === "a") return;
      const re = /\([^()]*\bunverified\b[^()]*\)/gi;
      if (!re.test(node.value)) return;
      re.lastIndex = 0;
      const out: (Text | Element)[] = [];
      let last = 0;
      for (const m of node.value.matchAll(re)) {
        const start = m.index ?? 0;
        if (start > last) out.push({ type: "text", value: node.value.slice(last, start) });
        out.push({
          type: "element",
          tagName: "span",
          properties: { className: ["unverified"], title: "Not confirmed against a primary source" },
          children: [{ type: "text", value: m[0] }],
        });
        store.unverified += 1;
        last = start + m[0].length;
      }
      if (last < node.value.length) out.push({ type: "text", value: node.value.slice(last) });
      parent.children.splice(index, 1, ...out);
      return index + out.length;
    });
  };
}

export async function renderMarkdown(source: string, rewrite: LinkRewriter): Promise<RenderedDoc> {
  const store: RenderedDoc = { html: "", toc: [], unverified: 0 };
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkExtractFrontMatter, store)
    .use(remarkModeBlocks)
    .use(remarkRewriteLinks, rewrite)
    .use(remarkToc, store)
    .use(remarkRehype, { handlers: { modeBlock: modeBlockHandler } })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["anchor"], ariaLabel: "Link to section" },
      content: { type: "text", value: "#" },
    })
    .use(rehypePolish, store)
    .use(rehypeStringify)
    .process(source);
  store.html = String(file);
  return store;
}
