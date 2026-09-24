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
import type { Root as MdastRoot, Heading, Link, Paragraph } from "mdast";
import type { Root as HastRoot, Element, Text } from "hast";

export type TocEntry = { id: string; text: string; depth: 2 | 3 };

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

/** Same slugger rules as rehype-slug, so TOC ids match the rendered headings. */
function remarkToc(store: RenderedDoc) {
  return (tree: MdastRoot) => {
    const slugger = new GithubSlugger();
    visit(tree, "heading", (node: Heading) => {
      if (node.depth !== 2 && node.depth !== 3) return;
      const text = toString(node);
      store.toc.push({ id: slugger.slug(text), text, depth: node.depth });
    });
  };
}

/** Tables scroll horizontally; external links open in a new tab; "(unverified)" gets a badge. */
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
      const re = /\(unverified[^)]*\)/gi;
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
    .use(remarkRewriteLinks, rewrite)
    .use(remarkToc, store)
    .use(remarkRehype)
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
