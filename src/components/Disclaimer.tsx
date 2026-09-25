import Link from "next/link";

/** Site-wide disclaimer, shown once in the footer instead of on every page. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 text-xs leading-6 text-fg-faint">
        <p>
          <span className="font-medium text-fg-muted">Not advice, and not guaranteed accurate.</span>{" "}
          The MEV Handbook is educational research. Figures are dated September 2026, claims marked
          (unverified) lack a primary source, and errors are possible. Nothing here is investment,
          financial, legal or tax advice.{" "}
          <Link href="/disclaimer" className="underline underline-offset-4 hover:text-fg">
            Read the full disclaimer
          </Link>
        </p>
      </div>
    </footer>
  );
}
