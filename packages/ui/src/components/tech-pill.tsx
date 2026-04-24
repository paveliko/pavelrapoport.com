import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/ui/lib/utils"

/**
 * TechPill — key/value metadata chip. Always a pair: a dim key on the
 * left, a bright value on the right, separated by a vertical 1px rule.
 * Use for technical facts: build hashes, latency, region, stack,
 * coordinates. Never for user-facing labels — use Badge or StatusPill.
 *
 *   <TechPill k="REGION" v="SFO" />
 *   <TechPill k="BUILD" v="#a4f1c" />
 */

const techPillVariants = cva(
  "inline-flex items-stretch overflow-hidden rounded-none border font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums",
  {
    variants: {
      tone: {
        default: "border-border text-foreground",
        accent:  "border-accent/40 text-foreground",
        primary: "border-primary/40 text-foreground",
        muted:   "border-border text-muted-foreground",
      },
    },
    defaultVariants: { tone: "default" },
  }
)

type TechPillProps = React.ComponentProps<"span"> &
  VariantProps<typeof techPillVariants> & {
    k: React.ReactNode
    v: React.ReactNode
  }

function TechPill({ className, tone, k, v, ...props }: TechPillProps) {
  return (
    <span
      data-slot="tech-pill"
      className={cn(techPillVariants({ tone }), className)}
      {...props}
    >
      <span className="bg-muted/40 px-1.5 py-0.5 text-muted-foreground">{k}</span>
      <span className="px-1.5 py-0.5">{v}</span>
    </span>
  )
}

export { TechPill, techPillVariants }
export type { TechPillProps }
