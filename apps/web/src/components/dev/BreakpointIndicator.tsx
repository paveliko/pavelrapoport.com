"use client";

import { useSyncExternalStore } from "react";

const BREAKPOINTS = [
  { name: "sm", width: 640, color: "rgba(34,197,94,0.25)" },
  { name: "md", width: 768, color: "rgba(59,130,246,0.25)" },
  { name: "lg", width: 1024, color: "rgba(168,85,247,0.25)" },
  { name: "xl", width: 1280, color: "rgba(245,158,11,0.25)" },
  { name: "2xl", width: 1536, color: "rgba(239,68,68,0.15)" },
] as const;

const ACTIVE_MULTIPLIER = 2.5;

function getActiveBreakpoint(vw: number): string | null {
  let active: string | null = null;
  for (const bp of BREAKPOINTS) {
    if (vw >= bp.width) active = bp.name;
  }
  return active;
}

function subscribe(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function getSnapshot() {
  return window.innerWidth;
}

function getServerSnapshot() {
  return 0;
}

export function BreakpointIndicator() {
  const vw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (vw === 0) return null;

  const active = getActiveBreakpoint(vw);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[99]"
      aria-hidden="true"
    >
      {BREAKPOINTS.map((bp) => {
        if (vw < bp.width) return null;

        const isActive = active === bp.name;
        const offset = (vw - bp.width) / 2;
        const opacity = isActive ? ACTIVE_MULTIPLIER : 1;

        return (
          <div key={bp.name}>
            {/* Left edge */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: offset,
                width: 1,
                backgroundColor: bp.color,
                opacity,
              }}
            >
              <span
                className="absolute top-1 left-1 text-[9px] font-mono leading-none"
                style={{ color: bp.color, opacity: isActive ? 1 : 0.7 }}
              >
                {bp.name}
              </span>
            </div>
            {/* Right edge */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                right: offset,
                width: 1,
                backgroundColor: bp.color,
                opacity,
              }}
            >
              <span
                className="absolute top-1 right-1 text-[9px] font-mono leading-none"
                style={{ color: bp.color, opacity: isActive ? 1 : 0.7 }}
              >
                {bp.width}px
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
