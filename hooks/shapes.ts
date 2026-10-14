// A bar shape turns a fill (0 to 1) into the cells it draws. `colorAt` gives
// the fill color at a place along the bar (0 to 1), so a gradient shape asks
// per cell and a solid fill answers the same color everywhere.
export type Cell = { char: string; color?: string; bg?: string }

export type ShapeInput = {
  fill: number
  width: number
  colorAt: (place: number) => string
  track: string
  muted: string
}

type Shape = (input: ShapeInput) => Cell[]

const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']

const clamp = (fill: number) => Math.min(1, Math.max(0, fill))
const placeOf = (i: number, width: number) => (i + 0.5) / width

// Filled cells in eighths of a cell on a solid track: the partial cell is
// drawn over the track, so there is no seam between it and the empty part.
function eighths({ fill, width, colorAt, track }: ShapeInput): Cell[] {
  const units = Math.round(clamp(fill) * width * 8)
  const full = Math.floor(units / 8)
  const part = EIGHTHS[units % 8]!
  const chars = [...Array<string>(full).fill('█'), ...(part ? [part] : [])]
  const filled = chars.map((char, i) => ({ char, color: colorAt(placeOf(i, width)), bg: track }))

  return [...filled, ...Array.from({ length: width - filled.length }, () => ({ char: ' ', bg: track }))]
}

// Whole cells: `on` for the filled ones in their color, `off` for the rest.
function glyphs(on: string, off: string, mutedOff = true): Shape {
  return ({ fill, width, colorAt, muted }) => {
    const n = Math.round(clamp(fill) * width)
    return Array.from({ length: width }, (_, i) =>
      i < n ? { char: on, color: colorAt(placeOf(i, width)) } : { char: off, color: mutedOff ? muted : undefined },
    )
  }
}

// The fill's last cells thin out (▓ ▒) into the track; a full bar is solid.
function faded(input: ShapeInput): Cell[] {
  const { fill, width, colorAt, track } = input
  const n = Math.round(clamp(fill) * width)
  const tail = n === width ? [] : ['▓', '▒'].slice(0, Math.max(0, n - 1))
  return Array.from({ length: width }, (_, i) => {
    if (i >= n) return { char: ' ', bg: track }
    const fromEnd = n - 1 - i
    const char = fromEnd < tail.length ? tail[tail.length - 1 - fromEnd]! : '█'
    return { char, color: colorAt(placeOf(i, width)), bg: track }
  })
}

// Half-cell steps: ⣿ full, ⡇ half, ⣀ the empty baseline.
function braille({ fill, width, colorAt, muted }: ShapeInput): Cell[] {
  const units = Math.round(clamp(fill) * width * 2)
  return Array.from({ length: width }, (_, i) => {
    const left = units - i * 2
    if (left >= 2) return { char: '⣿', color: colorAt(placeOf(i, width)) }
    if (left === 1) return { char: '⡇', color: colorAt(placeOf(i, width)) }
    return { char: '⣀', color: muted }
  })
}

function ascii(input: ShapeInput): Cell[] {
  return [{ char: '[', color: input.muted }, ...glyphs('#', '-')(input), { char: ']', color: input.muted }]
}

// Nerd Font caps around an eighths body. Each cap takes the color of the
// cell it touches: the fill's where the fill reaches it, else the track's.
function capped(left: string, right: string): Shape {
  return input => {
    const body = eighths(input)
    const first = body[0]!
    const last = body[body.length - 1]!
    const edge = (cell: Cell) => (cell.char === '█' ? cell.color! : input.track)
    return [{ char: left, color: edge(first) }, ...body, { char: right, color: edge(last) }]
  }
}

export const SHAPES = {
  blocks: eighths,
  shade: glyphs('▓', '░'),
  faded,
  slanted: glyphs('▰', '▱'),
  slashes: glyphs('╱', '╱'),
  dots: glyphs('●', '○'),
  squares: glyphs('■', '□'),
  line: glyphs('━', '─'),
  braille,
  ascii,
  pill: capped('', ''),
  powerline: capped('', ''),
} satisfies Record<string, Shape>

export type ShapeName = keyof typeof SHAPES

export const SHAPE_NAMES = Object.keys(SHAPES) as ShapeName[]
