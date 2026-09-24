
export type DocMeta = {
  slug: string;
  file: string;
  title: string;
  blurb: string;
  section: SectionId;
};

export type SectionId = "overview" | "strategies" | "infrastructure";

export type Section = {
  id: SectionId;
  title: string;
  tagline: string;
};

export const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Start here",
    tagline: "The map of the strategy space and the state of the market.",
  },
  {
    id: "strategies",
    title: "Strategies",
    tagline: "One explainer per strategy: mechanism, math, Solana specifics, risks.",
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    tagline: "How blocks are built and ordered, and what that means for bidding.",
  },
];

// Order here is the reading order used for the sidebar and prev/next links.
export const DOCS: DocMeta[] = [
  {
    slug: "strategies",
    file: "overview.md",
    title: "Strategy Landscape",
    blurb: "Nine strategies ranked by how much of an arb stack they reuse.",
    section: "overview",
  },
  {
    slug: "state-of-solana-mev",
    file: "state-of-solana-mev.md",
    title: "The State of MEV on Solana",
    blurb: "Who extracts what, the numbers, the builders, and where the edges are moving.",
    section: "overview",
  },
  {
    slug: "arbitrage",
    file: "arbitrage.md",
    title: "Arbitrage",
    blurb: "Spread, cyclic, CEX-DEX and backrunning. LVR, optimal size, tip auctions.",
    section: "strategies",
  },
  {
    slug: "liquidations",
    file: "liquidations.md",
    title: "Liquidations",
    blurb: "Health factors, bonus curves, oracles, flash loans, and the Solana lenders compared.",
    section: "strategies",
  },
  {
    slug: "jit-liquidity",
    file: "jit-liquidity.md",
    title: "JIT Liquidity",
    blurb: "Be the LP for one swap. Why it thrived on Ethereum and barely exists on Solana.",
    section: "strategies",
  },
  {
    slug: "market-making",
    file: "market-making.md",
    title: "Market Making",
    blurb: "Spread capture versus adverse selection, Avellaneda-Stoikov, markouts, Solana venues.",
    section: "strategies",
  },
  {
    slug: "statistical-arbitrage",
    file: "statistical-arbitrage.md",
    title: "Statistical Arbitrage",
    blurb: "Cointegration, half-lives, z-scores, and the LST fair-value trade.",
    section: "strategies",
  },
  {
    slug: "funding-rate",
    file: "funding-rate.md",
    title: "Funding-Rate Strategies",
    blurb: "Delta-neutral carry from perp funding, leg sizing, basis trades, historical data.",
    section: "strategies",
  },
  {
    slug: "launchpad-sniping",
    file: "launchpad-sniping.md",
    title: "Launchpad Sniping",
    blurb: "Bonding-curve math, same-slot execution, and the candid economics of memecoin launches.",
    section: "strategies",
  },
  {
    slug: "yield",
    file: "yield.md",
    title: "Yield Strategies",
    blurb: "Staking, lending, LP fees, looping and restaking, with the risk taxonomy priced out.",
    section: "strategies",
  },
  {
    slug: "directional",
    file: "directional.md",
    title: "Directional Trading",
    blurb: "Trend, momentum, events, sizing and the honest evidence on who makes money.",
    section: "strategies",
  },
  {
    slug: "solana-block-building",
    file: "solana-block-building.md",
    title: "Solana Block Building",
    blurb: "Jito, BAM, Harmonic and plain Agave: ordering, bidding, and the sender playbook.",
    section: "infrastructure",
  },
];

/** Basename of a markdown file (with or without directories) to its route. */
export function routeForMarkdownFile(href: string): string | null {
  const [pathPart, hash] = href.split("#");
  const base = pathPart.split("/").pop() ?? pathPart;
  const doc = DOCS.find((d) => d.file === base);
  if (!doc) return null;
  return `/docs/${doc.slug}${hash ? `#${hash}` : ""}`;
}

export function getDocMeta(slug: string): DocMeta | undefined {
  return DOCS.find((d) => d.slug === slug);
}

export function docsInSection(id: SectionId): DocMeta[] {
  return DOCS.filter((d) => d.section === id);
}

export function neighbours(slug: string): { prev?: DocMeta; next?: DocMeta } {
  const i = DOCS.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? DOCS[i - 1] : undefined, next: i >= 0 ? DOCS[i + 1] : undefined };
}
