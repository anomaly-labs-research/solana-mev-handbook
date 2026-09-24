import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
          <Logo />
          <span>
            MEV<span className="text-fg-muted"> Handbook</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/docs/strategies"
            className="rounded-md px-3 py-1.5 text-fg-muted transition hover:bg-bg-hover hover:text-fg"
          >
            Strategies
          </Link>
          <Link
            href="/docs/state-of-solana-mev"
            className="rounded-md px-3 py-1.5 text-fg-muted transition hover:bg-bg-hover hover:text-fg"
          >
            State of MEV
          </Link>
          <Link
            href="/docs/solana-block-building"
            className="hidden rounded-md px-3 py-1.5 text-fg-muted transition hover:bg-bg-hover hover:text-fg sm:block"
          >
            Block building
          </Link>
        </nav>
      </div>
    </header>
  );
}
