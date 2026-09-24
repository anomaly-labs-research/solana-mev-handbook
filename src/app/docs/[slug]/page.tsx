import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOCS, SECTIONS, getDocMeta, loadDoc, neighbours } from "@/lib/content";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { Toc } from "@/components/Toc";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = getDocMeta(slug);
  if (!meta) return {};
  return { title: meta.title, description: meta.blurb };
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { slug } = await params;
  const doc = await loadDoc(slug);
  if (!doc) notFound();

  const section = SECTIONS.find((s) => s.id === doc.section);
  const { prev, next } = neighbours(slug);

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-1 gap-10 px-4 sm:px-6">
      <Sidebar />
      <main className="min-w-0 flex-1 py-10 lg:py-12">
        <MobileNav />
        <article className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-border pb-8">
            <p className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-fg-faint">
              <span className="uppercase tracking-[0.14em]">{section?.title}</span>
              {doc.asOf && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-fg-muted">
                    {doc.asOf}
                  </span>
                </>
              )}
            </p>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {doc.h1 ?? doc.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-fg-muted">{doc.blurb}</p>
          </header>

          <div className="doc" dangerouslySetInnerHTML={{ __html: doc.html }} />

          <nav className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2" aria-label="Pagination">
            {prev ? (
              <Link
                href={`/docs/${prev.slug}`}
                className="card rounded-xl p-4"
              >
                <span className="text-xs text-fg-faint">Previous</span>
                <span className="mt-1 block text-sm font-medium">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/docs/${next.slug}`}
                className="card rounded-xl p-4 text-right"
              >
                <span className="text-xs text-fg-faint">Next</span>
                <span className="mt-1 block text-sm font-medium">{next.title}</span>
              </Link>
            )}
          </nav>
        </article>
      </main>
      <aside className="scroll-thin sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-12 xl:block">
        <Toc entries={doc.toc} />
      </aside>
    </div>
  );
}
