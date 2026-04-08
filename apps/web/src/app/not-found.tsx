import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col items-center justify-center px-6 bg-canvas text-ink font-serif">
        <h1 className="font-sans text-2xl font-semibold text-ink mb-3">404</h1>
        <p className="font-serif text-ink-light mb-6">Page not found</p>
        <Link
          href="/en"
          className="font-mono text-xs text-blueprint hover:text-blueprint-light transition-colors"
        >
          ← Back to home
        </Link>
      </body>
    </html>
  );
}
