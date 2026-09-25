"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/markdown";

/** Right-hand outline with scroll-spy: the heading nearest the top of the viewport is lit. */
export function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const onScroll = () => {
      const line = 96; // px from top; matches scroll-padding-top
      let current = headings[0].id;
      for (const h of headings) {
        if (h.getClientRects().length === 0) continue; // folded away by the reading mode
        if (h.getBoundingClientRect().top - line <= 0) current = h.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [entries]);

  if (entries.length === 0) return null;
  return (
    <nav className="toc" aria-label="On this page">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-faint">
        On this page
      </p>
      {entries.map((e) => (
        <a
          key={e.id}
          href={`#${e.id}`}
          data-depth={e.depth}
          data-active={active === e.id}
          data-modes={e.modes.join(" ")}
        >
          {e.text}
        </a>
      ))}
    </nav>
  );
}
