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
`src/lib/content.ts` (`DOCS`); add a file there to publish it. The renderer
(`src/lib/markdown.ts`) strips the leading `# Title` and `_As of …_` line into the page
header, rewrites relative `*.md` links to routes, builds the table of contents, wraps tables
for horizontal scroll, and badges every `(unverified)` marker.

To pull the latest markdown from the planckwave repo:

```bash
scripts/sync-content.sh            # expects ../planckwave
scripts/sync-content.sh /path/to/planckwave
```

## Deploy

Every route is statically generated, so any Next.js host works. On Vercel: import the repo,
framework preset Next.js, no environment variables needed.
