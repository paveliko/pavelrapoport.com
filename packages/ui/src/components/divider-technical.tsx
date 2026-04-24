import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/ui/lib/utils"

/**
 * DividerTechnical — a 1px rule with a mono label cut into it. Used
 * between sections inside a TacticalFrame or between stacked regions
 * in the studio. The label sits left-aligned by default; `align`
 * moves it.
 *
 *   <DividerTechnical label="SECTION_02" />
 *
 * Unlabeled form is a plain 1px rule — prefer shadcn <Separator /> for
 * that; keep DividerTechnical for labeled dividers.
 */

const dividerVariants = cva(
  "flex items-center gap-3 text-muted-foreground",
  {
    variants: {
      tone: {
        default: "[--rule:var(--border)]",
        accent:  "[--rule:color-mix(in_oklch,var(--accent)_40%,transparent)]",
        primary: "[--rule:color-mix(in_oklch,var(--primary)_40%,transparent)]",
      },
      align: {
        start: "",
        center: "justify-center",
        end: "flex-row-reverse",
      },
    },
    defaultVariants: { tone: "default", align: "start" },
  }
)

type DividerTechnicalProps = React.ComponentProps<"div"> &
  VariantProps<typeof dividerVariants> & {
    label?: React.ReactNode
    /** Optional right-side meta (timestamp, count). */
    meta?: React.ReactNode
  }

function DividerTechnical({
  className,
  tone,
  align,
  label,
  meta,
  ...props
}: DividerTechnicalProps) {
  return (
    <div
      role="separator"
      data-slot="divider-technical"
      className={cn(dividerVariants({ tone, align }), className)}
      {...props}
    >
      {label && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em]">
          {label}
        </span>
      )}
      <span
        aria-hidden
        className="h-px flex-1 bg-[color:var(--rule)]"
      />
      {meta && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] tabular-nums">
          {meta}
        </span>
      )}
    </div>
  )
}

export { DividerTechnical, dividerVariants }
export type { DividerTechnicalProps }
