import Link from "next/link";
import { DOCS, SECTIONS, docsInSection } from "@/lib/manifest";
import { DocCard } from "@/components/DocCard";

export default function Home() {
  const featured = DOCS.filter((d) => d.section === "overview");
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg" />
        <div className="spot" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24 sm:pt-32">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated/70 px-3 py-1 text-xs font-medium text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Solana · as of September 2026
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Solana MEV Handbook.
            <span className="block text-fg-faint">Strategy by strategy.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            What each on-chain trading strategy is, how the math works, what it looks like on
            <span className="rounded bg-accent/15 px-1 text-accent">Solana, and where the edge has moved.</span> Researched from primary sources, with every
            unconfirmed claim marked.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/docs/strategies"
              className="rounded-lg bg-fg px-4 py-2.5 text-sm font-medium text-bg transition hover:bg-white/90"
            >
              Start with the landscape
            </Link>
            <Link
              href="/docs/state-of-solana-mev"
              className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-fg transition hover:bg-bg-hover"
            >
              State of MEV on Solana
            </Link>
          </div>
          <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              [String(DOCS.length), "explainers"],
              [String(DOCS.filter((d) => d.section === "strategies").length), "strategies"],
              ["250+", "sources cited"],
              ["approaching 200 ms", "slot time"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="text-2xl font-semibold tracking-tight">{n}</dt>
                <dd className="text-sm text-fg-faint">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((d) => (
            <DocCard key={d.slug} doc={d} large />
          ))}
        </div>
      </section>

      {
        SECTIONS.filter((s) => s.id !== "overview").map((section) => (
          <section key={section.id} className="mx-auto max-w-6xl px-6 pb-16">
            <div className="mb-6 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">{section.tagline}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docsInSection(section.id).map((d) => (
                <DocCard key={d.slug} doc={d} />
              ))}
            </div>
          </section>
        ))
      }

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-fg-faint">
          <span>MEV Handbook. Research notes, not investment advice.</span>
          <span>Figures dated September 2026. Claims marked (unverified) lack a primary source.</span>
        </div>
      </footer>
    </main >
  );
}
