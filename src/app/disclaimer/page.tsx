import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "What this handbook is, what it is not, and how much to trust it.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-fg-faint">Please read</p>
      <h1 className="text-4xl font-semibold tracking-tight">Disclaimer</h1>
      <div className="doc mt-8">
        <h2>Not investment advice</h2>
        <p>
          Nothing in this handbook is investment, financial, trading, legal or tax advice, and nothing
          here is a recommendation to buy, sell or hold any asset or to run any strategy. It is
          educational material describing how certain on-chain trading strategies work. Decisions you
          make after reading it are your own, and you alone bear the consequences.
        </p>
        <h2>It may be wrong</h2>
        <p>
          The notes were researched from public sources and are dated (each page carries an
          &ldquo;as of&rdquo; line). Protocols change parameters, block builders change rules, and
          market figures move quickly, so any number here may be stale by the time you read it. Some
          claims could not be confirmed against a primary source and are marked{" "}
          <span className="unverified">(unverified)</span>. Worked examples use simplified models and
          round numbers. Treat every figure as an illustration, not a fact to trade on, and check the
          primary sources listed at the end of each page.
        </p>
        <h2>The strategies carry real risk</h2>
        <p>
          Arbitrage, liquidations, market making, sniping, leverage, yield and directional trading can
          all lose money, in some cases more than the capital committed. Most participants in the
          most competitive strategies lose money net of infrastructure and fees. Smart contracts can
          be exploited, oracles can fail, pegs can break, and exchanges can halt withdrawals. Some
          activities described here may be restricted or regulated where you live; you are
          responsible for knowing the law that applies to you.
        </p>
        <h2>No endorsement</h2>
        <p>
          Protocols, companies, venues and products are named to describe the market, not to endorse
          them. The authors may hold positions in assets mentioned. Reading levels (beginner,
          intermediate, expert) change how much of each page is shown, not how accurate it is.
        </p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm text-accent-strong underline underline-offset-4">
        Back to the handbook
      </Link>
    </main>
  );
}
