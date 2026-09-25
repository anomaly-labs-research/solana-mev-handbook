# MEV Handbook

A reader for the MEV and trading-strategy explainers written for the planckwave project:
what each strategy is, how the math works, what it looks like on Solana, and where the edge
is moving. Built with Next.js 16 (App Router), Tailwind v4 and a unified/remark markdown
pipeline, with a neutral dark theme and a single indigo accent.

## Develop

```bash
bun install
bun run dev        # http://localhost:3000
bun run build      # static generation of every doc
bun run lint
```

## Content

Markdown lives in `content/` (the strategy explainers, the state-of-MEV and block-building notes). The pages, order and blurbs are declared in
`src/lib/manifest.ts` (`DOCS`); add a file there to publish it. The renderer
(`src/lib/markdown.ts`) strips the leading `# Title` and `_As of …_` line into the page
header, rewrites relative `*.md` links to routes, builds the table of contents, wraps tables
for horizontal scroll, and badges every parenthetical containing `unverified`.

### Reading modes

Every page can be read at three levels: **Beginner**, **Intermediate** and **Expert**. The
choice lives in `localStorage`, is applied to `<html data-mode>` before first paint, and CSS
folds away anything not meant for that level, so the site stays fully static. The levels are
declared in `src/lib/modes.ts`; the switch is in the header and on the home page.

Content is tagged in the markdown with HTML comments, which never render:

```md
## Some section
<!-- level: intermediate -->     ← this section shows in intermediate and expert

### A derivation
<!-- level: expert -->           ← expert only

<!-- only: beginner -->          ← shown only in beginner mode
## In plain terms
…
<!-- /only -->

Paragraph everyone sees.

<!-- level: expert -->           ← a few paragraphs, closed explicitly
The heavy part.
<!-- /level -->
```

A marker directly after a heading covers that heading's whole section (up to the next heading
of the same or shallower depth) and needs no closer. Elsewhere it runs to its `<!-- /level -->`
or `<!-- /only -->`, or to the next heading if there is none. Blocks nest. Untagged content is
visible everywhere; keep `## Sources` untagged. Leave a blank line before and after a marker.
Each explainer opens with a beginner-only `## In plain terms` block.

To see what each mode shows for a page:

```bash
bun run scripts/mode-report.ts            # every doc
bun run scripts/mode-report.ts arbitrage  # one slug
```

### Syncing from planckwave

The mode markers and the plain-language blocks live only in this repo's copies. Running the
sync script overwrites `content/` with the upstream markdown and drops them, so either port the
markers upstream first or re-apply them after a sync.

```bash
scripts/sync-content.sh            # expects ../planckwave
scripts/sync-content.sh /path/to/planckwave
```

### Disclaimer

Every explainer carries a "not advice, not guaranteed accurate" callout, the footer repeats it,
and `/disclaimer` has the full text (`src/app/disclaimer/page.tsx`).

## Deploy

Every route is prerendered and `next.config.ts` sets `output: "export"`, so `bun run build`
writes a plain static site to `out/`. Any static host works.

On Cloudflare Workers, `wrangler.jsonc` points the assets directory at `out/`. Build command
`bun run build` (or `npx next build`), deploy command `npx wrangler deploy`. To check locally:

```bash
bun run build && npx wrangler dev
```
