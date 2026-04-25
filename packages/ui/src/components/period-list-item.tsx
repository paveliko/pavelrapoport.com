import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

/**
 * PeriodListItem — one row in the About-section career list.
 *
 * The list is the primary information channel for the timeline: every
 * fact that the SVG strip conveys must also appear here. This component
 * receives all strings as props (no next-intl import) and renders as a
 * semantic <article> meant to live inside an <ol>.
 *
 * Highlighted rows get a 2px accent border-left in the role-type color
 * passed via `accentTw`. Non-highlighted rows get a 1px neutral border
 * so the visual rhythm stays consistent down the column.
 *
 * Anchor target: the rendered element gets `id={`period-${id}`}` so the
 * timeline strip can scroll-and-focus it.
 *
 * `body` is the period summary; if it contains "\n\n" separators each
 * paragraph renders as its own <p>.
 */

export interface PeriodListItemProps {
  /** Used as the DOM id (`period-${id}`) for strip-to-list scrolling. */
  id: string
  /** Pre-formatted years string, e.g. "2020 — present" or "2003 – 2007". */
  yearsLabel: string
  organization: string
  role: string
  /** Pre-formatted "City, Country" or "Country" only. */
  location: string
  tech: readonly string[]
  /** Period summary; "\n\n" splits into paragraphs. */
  body: string
  highlighted: boolean
  /** Tailwind class for the highlighted border-left, e.g. "border-l-accent-architect". */
  accentTw: string
  /** Optional notable-callout strings rendered above the body. */
  notable?: readonly string[]
  className?: string
}

function PeriodListItem({
  id,
  yearsLabel,
  organization,
  role,
  location,
  tech,
  body,
  highlighted,
  accentTw,
  notable,
  className,
}: PeriodListItemProps) {
  const paragraphs = body.split("\n\n")

  return (
    <article
      id={`period-${id}`}
      tabIndex={0}
      data-slot="period-list-item"
      data-highlighted={highlighted ? "true" : "false"}
      className={cn(
        "scroll-mt-24 border-l py-4 pl-5 outline-none transition-colors",
        "focus-visible:bg-secondary",
        highlighted ? cn("border-l-2", accentTw) : "border-l-border",
        className,
      )}
    >
      <header className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {yearsLabel}
        </span>
        <h3 className="font-medium text-foreground">{organization}</h3>
        <span className="text-muted-foreground">{role}</span>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {location}
        </span>
      </header>

      {tech.length > 0 && (
        <p className="mb-2 font-mono text-[11px] text-muted-foreground">
          {tech.join(" · ")}
        </p>
      )}

      {notable && notable.length > 0 && (
        <ul className="mb-3 space-y-1">
          {notable.map((line, i) => (
            <li
              key={i}
              className="text-sm text-foreground"
            >
              <span aria-hidden className="mr-2 text-muted-foreground">
                ※
              </span>
              {line}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 text-sm leading-relaxed text-foreground">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  )
}

export { PeriodListItem }
