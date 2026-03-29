import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <h1 className="font-sans text-2xl font-semibold text-ink mb-3">
        404
      </h1>
      <p className="font-serif text-ink-light mb-6">
        Page not found
      </p>
      <Link
        href="/ru"
        className="font-mono text-xs text-blueprint hover:text-blueprint-light transition-colors"
      >
        ← Back to timeline
      </Link>
    </div>
  );
}
