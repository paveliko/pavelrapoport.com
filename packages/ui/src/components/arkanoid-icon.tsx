import * as React from "react"

/**
 * ArkanoidIcon — a stylized wireframe evoking the 1990 Arkanoid origin
 * moment: two rows of bricks above a ball and a paddle.
 *
 * Intentionally abstract, not a pixel-accurate replica of the historical
 * game. Uses `currentColor` for every stroke so it inherits the text
 * color of whatever block it sits in — works in light and dark without
 * variants.
 *
 *   <ArkanoidIcon size={64} aria-label="Arkanoid, 1990" />
 *
 * Target sizes: 40 / 64 / 96 px. The viewBox is 64×64; at smaller sizes
 * the 1.5px stroke remains crisp because both axes scale together.
 */

interface ArkanoidIconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  /** Square pixel size. Defaults to 64. */
  size?: number | string
}

function ArkanoidIcon({
  size = 64,
  "aria-label": ariaLabel,
  className,
  ...props
}: ArkanoidIconProps) {
  const hasLabel = Boolean(ariaLabel)

  // Brick grid: 2 rows × 6 cols, inside the 5.5→58.5 horizontal band
  // and the 10→21.5 vertical band. Cell width 8, height 5.5, 1px gap.
  // Sparser layout reads as a recognizable Arkanoid wall at hero sizes
  // (96+ px) rather than a dense brick field.
  const bricks: Array<{ x: number; y: number }> = []
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      bricks.push({ x: 5.5 + col * 9, y: 10 + row * 6.5 })
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      role={hasLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={hasLabel ? undefined : true}
      data-slot="arkanoid-icon"
      className={className}
      {...props}
    >
      {bricks.map((b) => (
        <rect
          key={`${b.x}-${b.y}`}
          x={b.x}
          y={b.y}
          width={8}
          height={5.5}
          rx={0.5}
        />
      ))}

      {/* Ball + short motion streak toward the paddle */}
      <line x1={28} y1={34} x2={22} y2={40} />
      <circle cx={28} cy={34} r={2} fill="currentColor" stroke="none" />

      {/* Paddle */}
      <rect x={20} y={50} width={24} height={3} rx={1} />
    </svg>
  )
}

export { ArkanoidIcon }
export type { ArkanoidIconProps }
