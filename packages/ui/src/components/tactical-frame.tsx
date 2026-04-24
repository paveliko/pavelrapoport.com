"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@repo/ui/lib/utils"

/**
 * TacticalFrame — the signature container of the Rapoport Studio system.
 *
 * Four hard-cornered L-brackets sit at the corners of a sharp-edged box.
 * When `animated`, the brackets deploy from the geometric center of the
 * frame outward to their final corner positions (560ms, ease-out), and
 * the optional label divider sweeps in from left. Subsequent frames on
 * the same page can stagger via `staggerIndex` (60ms per index).
 *
 * This is NOT a card. It frames content — charts, transcripts, terminals,
 * kits-of-parts. Use sparingly; one to three per viewport.
 */

const frameVariants = cva(
  "relative",
  {
    variants: {
      tone: {
        /** Ink on ivory. Default. */
        default: "text-foreground",
        /** Terracotta corners — for active / primary frames. */
        primary: "text-foreground [--bracket-color:var(--primary)]",
        /** Cool-blue corners — for technical / blueprint frames. */
        accent:  "text-foreground [--bracket-color:var(--accent)]",
        /** Muted — archival, inactive, de-emphasized. */
        muted:   "text-muted-foreground [--bracket-color:var(--muted-foreground)]",
      },
      size: {
        sm: "[--bracket-size:12px] [--bracket-thickness:1px] [--bracket-inset:0px]",
        md: "[--bracket-size:16px] [--bracket-thickness:1px] [--bracket-inset:0px]",
        lg: "[--bracket-size:24px] [--bracket-thickness:2px] [--bracket-inset:0px]",
      },
    },
    defaultVariants: { tone: "default", size: "md" },
  }
)

type TacticalFrameProps = React.ComponentProps<"div"> &
  VariantProps<typeof frameVariants> & {
    /** Small uppercase mono caption rendered above the frame. */
    label?: React.ReactNode
    /** Right-aligned meta rendered next to `label`. */
    meta?: React.ReactNode
    /** When true, brackets deploy from center on mount. */
    animated?: boolean
    /** For staggering: 0 is first frame on page, 1 is next, etc. */
    staggerIndex?: number
    /** Render a 1px border between the brackets (off by default). */
    bordered?: boolean
  }

function TacticalFrame({
  className,
  tone,
  size,
  label,
  meta,
  animated = false,
  staggerIndex = 0,
  bordered = false,
  children,
  style,
  ...props
}: TacticalFrameProps) {
  const animStyle: React.CSSProperties = animated
    ? {
        // 60ms stagger per index, ~560ms deploy
        ["--bracket-delay" as string]: `${staggerIndex * 60}ms`,
      }
    : {}

  return (
    <div
      data-slot="tactical-frame"
      data-tactical-animated={animated ? "" : undefined}
      className={cn(frameVariants({ tone, size }), className)}
      style={{ ...animStyle, ...style }}
      {...props}
    >
      {(label || meta) && (
        <div
          data-slot="tactical-frame-label"
          className="mb-2 flex items-baseline justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span className="truncate">{label}</span>
          {meta && <span className="shrink-0 tabular-nums">{meta}</span>}
        </div>
      )}

      <div
        data-slot="tactical-frame-body"
        className={cn(
          "relative",
          bordered && "border border-border"
        )}
      >
        {/* Four L-brackets. Each is an ::before + ::after pair drawn as borders. */}
        <TacticalCorner position="tl" animated={animated} />
        <TacticalCorner position="tr" animated={animated} />
        <TacticalCorner position="bl" animated={animated} />
        <TacticalCorner position="br" animated={animated} />
        {children}
      </div>
    </div>
  )
}

const cornerClass: Record<"tl" | "tr" | "bl" | "br", string> = {
  tl: "top-0 left-0 border-t border-l",
  tr: "top-0 right-0 border-t border-r",
  bl: "bottom-0 left-0 border-b border-l",
  br: "bottom-0 right-0 border-b border-r",
}

function TacticalCorner({
  position,
  animated,
}: {
  position: "tl" | "tr" | "bl" | "br"
  animated: boolean
}) {
  // translate origin: for deploy-from-center, each corner starts at (0,0)
  // relative to its own final anchor, translated toward the frame center.
  const fromX = position.endsWith("l") ? "50%" : "-50%"
  const fromY = position.startsWith("t") ? "50%" : "-50%"

  return (
    <span
      aria-hidden
      data-tactical-corner={position}
      className={cn(
        "pointer-events-none absolute block",
        "h-[var(--bracket-size)] w-[var(--bracket-size)]",
        "border-[color:var(--bracket-color,currentColor)]",
        // thickness comes from --bracket-thickness via arbitrary border-width
        "[border-top-width:var(--bracket-thickness)]",
        "[border-right-width:var(--bracket-thickness)]",
        "[border-bottom-width:var(--bracket-thickness)]",
        "[border-left-width:var(--bracket-thickness)]",
        // reset sides: only the two edges forming the L stay visible
        position === "tl" && "border-r-0 border-b-0",
        position === "tr" && "border-l-0 border-b-0",
        position === "bl" && "border-r-0 border-t-0",
        position === "br" && "border-l-0 border-t-0",
        cornerClass[position].replace(/border-[tlrb]\b/g, ""), // keep position only
        // Position anchors:
        position === "tl" && "top-0 left-0",
        position === "tr" && "top-0 right-0",
        position === "bl" && "bottom-0 left-0",
        position === "br" && "bottom-0 right-0",
      )}
      style={
        animated
          ? ({
              animation:
                "tactical-bracket-deploy 560ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
              animationDelay: "var(--bracket-delay, 0ms)",
              ["--bracket-from-x" as string]: fromX,
              ["--bracket-from-y" as string]: fromY,
              transformOrigin: "center",
            } as React.CSSProperties)
          : undefined
      }
    />
  )
}

export { TacticalFrame }
export type { TacticalFrameProps }
