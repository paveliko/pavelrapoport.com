"use client";

import { useEffect } from "react";

/**
 * AxeInit — boots @axe-core/react in development only. It scans the
 * mounted React tree every 1000 ms and prints any WCAG violations to
 * the browser console with the offending DOM nodes.
 *
 * Mounted in apps/web/src/app/[locale]/layout.tsx behind a
 * NODE_ENV === "development" guard so the dev-only dependency never
 * ships to production. The component itself also no-ops outside dev.
 */
export function AxeInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    void (async () => {
      const [{ default: React }, ReactDOM, { default: axe }] =
        await Promise.all([
          import("react"),
          import("react-dom"),
          import("@axe-core/react"),
        ]);
      // Note: dev-only chrome (e.g. BreakpointIndicator) is marked with
      // data-axe-skip="true" so verification audits run from the
      // browser console can exclude it. The continuous monitor below
      // does still report those nodes — that's expected dev noise.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await axe(React as any, ReactDOM, 1000);
    })();
  }, []);

  return null;
}
