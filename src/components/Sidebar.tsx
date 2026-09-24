"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS, docsInSection } from "@/lib/manifest";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-7">
      {SECTIONS.map((section) => (
        <div key={section.id}>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-faint">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {docsInSection(section.id).map((doc) => {
              const href = `/docs/${doc.slug}`;
              const active = pathname === href;
              return (
                <li key={doc.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-1.5 text-sm transition ${
                      active
                        ? "bg-bg-hover font-medium text-fg"
                        : "text-fg-muted hover:bg-bg-hover hover:text-fg"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1 w-1 shrink-0 rounded-full ${
                          active ? "bg-accent" : "bg-transparent"
                        }`}
                      />
                      {doc.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="scroll-thin sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border py-8 pr-4 lg:block">
      <NavList />
    </aside>
  );
}

/** Collapsible version for narrow screens, rendered above the article. */
export function MobileNav() {
  return (
    <details className="group mb-6 rounded-xl border border-border bg-bg-elevated lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
        Browse the handbook
        <svg
          className="h-4 w-4 text-fg-faint transition group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-border px-2 py-4">
        <NavList />
      </div>
    </details>
  );
}
