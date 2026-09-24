import Link from "next/link";
import type { DocMeta } from "@/lib/manifest";

export function DocCard({ doc, large = false }: { doc: DocMeta; large?: boolean }) {
  return (
    <Link
      href={`/docs/${doc.slug}`}
      className={`card group flex flex-col justify-between rounded-xl ${
        large ? "p-7" : "p-5"
      }`}
    >
      <div>
        <h3 className={`font-semibold tracking-tight ${large ? "text-xl" : "text-base"}`}>
          {doc.title}
        </h3>
        <p className={`mt-2 text-fg-muted ${large ? "text-base leading-7" : "text-sm leading-6"}`}>
          {doc.blurb}
        </p>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-fg-faint transition group-hover:text-fg">
        Read
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
