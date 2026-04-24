import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/ui/lib/utils"

/**
 * MonoLabel — the small uppercase mono caption that sits above every
 * meaningful region in Rapoport Studio. Replaces shadcn's silent
 * labels for section headers, metadata rows, and frame titles.
 *
 * Tracking and size are intentionally tight (0.14em / 10-11px) to read
 * as technical typography, not UI chrome.
 */

const monoLabelVariants = cva(
  "font-mono uppercase tabular-nums tracking-[0.14em]",
  {
    variants: {
      size: {
        xs: "text-[9px]",
        sm: "text-[10px]",
        md: "text-[11px]",
        lg: "text-xs",
      },
      tone: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
        accent: "text-accent",
      },
    },
    defaultVariants: { size: "sm", tone: "muted" },
  }
)

type MonoLabelProps = React.ComponentProps<"span"> &
  VariantProps<typeof monoLabelVariants>

function MonoLabel({ className, size, tone, ...props }: MonoLabelProps) {
  return (
    <span
      data-slot="mono-label"
      className={cn(monoLabelVariants({ size, tone }), className)}
      {...props}
    />
  )
}

export { MonoLabel, monoLabelVariants }
export type { MonoLabelProps }
