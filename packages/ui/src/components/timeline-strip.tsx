"use client"

import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * TimelineStrip — minimal SVG visual anchor for the About-section
 * career timeline. A single horizontal axis from `axisStartYear` to
 * `axisEndYear` with one square per period. Periods that start before
 * `axisStartYear` (the Origin period in 1990) render as a detached
 * square at the far left, joined to the main axis by a dotted bridge.
 *
 * The strip is decorative-plus: every piece of information it conveys
 * is also present in the period list below. Color carries no meaning
 * on its own — list rendering is the source of truth.
 *
 * No knowledge of period types, accent tokens, or i18n. Consumer
 * pre-computes:
 *   - `tw` className per period (e.g. "text-accent-architect"). Strokes
 *      and fills use `currentColor`, so this drives the visible color.
 *   - `highlighted` flag — picks the larger square size.
 *   - `tooltip` and `axisLabel` strings.
 */

export interface TimelineStripPeriod {
  /** Used for the DOM target the click handler scrolls to. */
  id: string
  /** Calendar year of the period's start. */
  startYear: number
  /** Tailwind class providing the foreground color, e.g. "text-accent-architect". */
  tw: string
  /** Larger 14×14 square instead of 10×10. */
  highlighted: boolean
  /** Read by screen readers and shown on hover via <title>. */
  tooltip: string
}

export interface TimelineStripProps {
  /** Sorted oldest-first; tab order follows array order. */
  periods: readonly TimelineStripPeriod[]
  /** Year of the leftmost main-axis tick. Default 2000. */
  axisStartYear?: number
  /** Year of the rightmost main-axis tick. Required (caller passes the current year). */
  axisEndYear: number
  /** Short SVG label, rendered as <title>. Required for accessibility. */
  axisLabel: string
  /** Longer SVG description, rendered as <desc>. Required for accessibility. */
  axisDescription: string
  /** Click + Enter handler. Default scrolls to `#period-{id}` and focuses it. */
  onActivate?: (id: string) => void
  className?: string
}

const VIEWBOX_WIDTH = 800
const VIEWBOX_HEIGHT = 100
const AXIS_Y = 50
const MAIN_AXIS_LEFT = 100
const MAIN_AXIS_RIGHT = 780
const DETACHED_X = 40
const BRIDGE_LEFT = 60
const BRIDGE_RIGHT = MAIN_AXIS_LEFT
const TICK_INTERVAL_YEARS = 5
const TICK_HEIGHT = 6
const SQUARE_SIZE_NORMAL = 10
const SQUARE_SIZE_HIGHLIGHTED = 14

const FLASH_DURATION_MS = 1500

function defaultActivate(id: string) {
  if (typeof document === "undefined") return
  const target = document.getElementById(`period-${id}`)
  if (!target) return

  // Update URL hash so the link is shareable. replaceState avoids
  // creating a history entry per click — back button skips back to
  // wherever the user actually came from, not through every square.
  if (typeof window !== "undefined") {
    window.history.replaceState(null, "", `#period-${id}`)
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" })
  if (!(target instanceof HTMLElement)) return

  target.focus({ preventScroll: true })

  // 1.5s flash via CSS animation on data-period-flashing. Remove first
  // and force reflow so re-clicking the same square re-triggers the
  // animation instead of doing nothing.
  target.removeAttribute("data-period-flashing")
  void target.offsetWidth
  target.setAttribute("data-period-flashing", "true")
  window.setTimeout(() => {
    target.removeAttribute("data-period-flashing")
  }, FLASH_DURATION_MS)
}

function yearToX(
  year: number,
  axisStartYear: number,
  axisEndYear: number,
): number {
  const span = axisEndYear - axisStartYear
  if (span <= 0) return MAIN_AXIS_LEFT
  const ratio = (year - axisStartYear) / span
  return MAIN_AXIS_LEFT + ratio * (MAIN_AXIS_RIGHT - MAIN_AXIS_LEFT)
}

function buildTicks(start: number, end: number): number[] {
  const ticks: number[] = []
  const first = Math.ceil(start / TICK_INTERVAL_YEARS) * TICK_INTERVAL_YEARS
  for (let y = first; y <= end; y += TICK_INTERVAL_YEARS) {
    ticks.push(y)
  }
  return ticks
}

function TimelineStrip({
  periods,
  axisStartYear = 2000,
  axisEndYear,
  axisLabel,
  axisDescription,
  onActivate,
  className,
}: TimelineStripProps) {
  const handleActivate = onActivate ?? defaultActivate
  const ticks = buildTicks(axisStartYear, axisEndYear)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      role="img"
      aria-label={axisLabel}
      className={cn("h-auto w-full", className)}
      data-slot="timeline-strip"
    >
      {/* SVG-native accessibility: <title> mirrors aria-label as a
          fallback for older assistive tech, <desc> adds the longer
          summary. <title> must be the first child to be picked up
          reliably across screen readers. */}
      <title>{axisLabel}</title>
      <desc>{axisDescription}</desc>
      {/* Detached → main bridge (dotted) */}
      <line
        x1={BRIDGE_LEFT}
        y1={AXIS_Y}
        x2={BRIDGE_RIGHT}
        y2={AXIS_Y}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 2"
        className="text-border"
      />

      {/* Main axis */}
      <line
        x1={MAIN_AXIS_LEFT}
        y1={AXIS_Y}
        x2={MAIN_AXIS_RIGHT}
        y2={AXIS_Y}
        stroke="currentColor"
        strokeWidth={1}
        className="text-border"
      />

      {/* 5-year ticks */}
      {ticks.map((year) => {
        const x = yearToX(year, axisStartYear, axisEndYear)
        return (
          <g key={year} className="text-muted-foreground">
            <line
              x1={x}
              y1={AXIS_Y}
              x2={x}
              y2={AXIS_Y + TICK_HEIGHT}
              stroke="currentColor"
              strokeWidth={1}
            />
            <text
              x={x}
              y={AXIS_Y + TICK_HEIGHT + 12}
              fontSize={9}
              textAnchor="middle"
              fill="currentColor"
              className="font-mono tabular-nums"
            >
              {year}
            </text>
          </g>
        )
      })}

      {/* Period squares */}
      {periods.map((p) => {
        const detached = p.startYear < axisStartYear
        const cx = detached
          ? DETACHED_X
          : yearToX(p.startYear, axisStartYear, axisEndYear)
        const size = p.highlighted ? SQUARE_SIZE_HIGHLIGHTED : SQUARE_SIZE_NORMAL
        const x = cx - size / 2
        const y = AXIS_Y - size / 2

        return (
          <rect
            key={p.id}
            x={x}
            y={y}
            width={size}
            height={size}
            tabIndex={0}
            fill="currentColor"
            stroke="currentColor"
            className={cn(
              "cursor-pointer outline-none transition-opacity",
              "hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring",
              p.tw,
            )}
            onClick={() => handleActivate(p.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleActivate(p.id)
              }
            }}
            data-period-id={p.id}
          >
            <title>{p.tooltip}</title>
          </rect>
        )
      })}
    </svg>
  )
}

export { TimelineStrip }
