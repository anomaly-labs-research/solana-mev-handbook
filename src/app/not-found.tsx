import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-6xl font-semibold tracking-tight text-fg-faint">404</p>
      <h1 className="mt-4 text-xl font-semibold">That page is not in the handbook.</h1>
      <Link href="/" className="mt-6 text-sm text-accent-strong underline underline-offset-4">
        Back to the start
      </Link>
    </main>
  );
}
