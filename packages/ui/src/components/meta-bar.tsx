import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * MetaBar — the thin mono strip that runs along the top or bottom of a
 * frame, the studio viewport, or the landing hero. Hosts a left cluster
 * (file/path/slug) and a right cluster (timestamp, build hash, status).
 * Separator is a 1px vertical rule — no pipe characters.
 *
 *   <MetaBar
 *     left={<><MonoLabel>pav/studio</MonoLabel><MonoLabel>brand_system.v3</MonoLabel></>}
 *     right={<TechPill k="BUILD" v="#a4f1c" />}
 *   />
 */

type MetaBarProps = React.ComponentProps<"div"> & {
  left?: React.ReactNode
  right?: React.ReactNode
  /** Render as a top bar with bottom border (default) or bottom bar with top border. */
  position?: "top" | "bottom"
}

function MetaBar({
  className,
  left,
  right,
  position = "top",
  children,
  ...props
}: MetaBarProps) {
  return (
    <div
      data-slot="meta-bar"
      data-position={position}
      className={cn(
        "flex h-7 items-center justify-between gap-4 px-3",
        "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground",
        position === "top" ? "border-b border-border" : "border-t border-border",
        className
      )}
      {...props}
    >
      <div
        data-slot="meta-bar-left"
        className="flex min-w-0 items-center gap-3 divide-x divide-border [&>*]:pr-3 [&>*:last-child]:pr-0"
      >
        {left}
      </div>
      <div
        data-slot="meta-bar-right"
        className="flex shrink-0 items-center gap-3 divide-x divide-border [&>*]:pl-3 [&>*:first-child]:pl-0"
      >
        {right}
      </div>
      {children}
    </div>
  )
}

export { MetaBar }
export type { MetaBarProps }
