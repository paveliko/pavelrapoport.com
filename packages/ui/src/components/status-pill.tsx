import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/ui/lib/utils"

/**
 * StatusPill — terse state readout. Single-word statuses only: LIVE,
 * DEPLOYING, DRAFT, ARCHIVED, ERROR. Do NOT use this for categories
 * (use Badge) or for counts (use inline mono text).
 *
 * A 6px dot sits left of the label. When `pulse`, the dot pulses at
 * 2 Hz — reserve for actively-changing states (LIVE traffic, DEPLOYING).
 */

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] tabular-nums",
  {
    variants: {
      status: {
        live:      "border-primary text-primary [--dot:var(--primary)]",
        deploying: "border-accent text-accent [--dot:var(--accent)]",
        draft:     "border-border text-muted-foreground [--dot:var(--muted-foreground)]",
        archived:  "border-border text-muted-foreground opacity-70 [--dot:var(--muted-foreground)]",
        error:     "border-destructive text-destructive [--dot:var(--destructive)]",
      },
    },
    defaultVariants: { status: "live" },
  }
)

type StatusPillProps = React.ComponentProps<"span"> &
  VariantProps<typeof statusPillVariants> & {
    pulse?: boolean
    children?: React.ReactNode
  }

function StatusPill({
  className,
  status,
  pulse = false,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      data-slot="status-pill"
      data-status={status}
      className={cn(statusPillVariants({ status }), className)}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-1.5 shrink-0 rounded-full bg-[color:var(--dot)]",
          pulse && "animate-pulse"
        )}
      />
      {children}
    </span>
  )
}

export { StatusPill, statusPillVariants }
export type { StatusPillProps }
