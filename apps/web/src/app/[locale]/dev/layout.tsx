import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Production guard for every /dev/* route.
 *
 * Returns 404 unless we're running `next dev`. Keeps preview routes
 * (like /dev/about-preview) out of the deployed pavelrapoport.com.
 * Apply this as a segment layout — it covers all descendants without
 * each preview page having to remember.
 */
export default function DevSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <>{children}</>;
}
