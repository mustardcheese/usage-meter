import { describe, expect, test } from 'claude-code/testing'

import { SHAPE_NAMES, SHAPES, type ShapeInput } from './shapes'

const input = (fill: number, width = 8): ShapeInput => ({
  fill,
  width,
  colorAt: place => `c${Math.floor(place * 10)}`,
  track: 'T',
  muted: 'M',
})
const chars = (name: keyof typeof SHAPES, fill: number) =>
  SHAPES[name](input(fill))
    .map(c => c.char)
    .join('')

describe('every shape', () => {
  test('keeps its width at empty, partial and full', () => {
    for (const name of SHAPE_NAMES) {
      const extra = ['ascii', 'pill', 'powerline'].includes(name) ? 2 : 0
      for (const fill of [0, 0.37, 1]) expect(SHAPES[name](input(fill))).toHaveLength(8 + extra)
    }
  })

  test('colors nothing in the fill color when empty, and clamps out-of-range fills', () => {
    for (const name of SHAPE_NAMES) {
      expect(SHAPES[name](input(0)).some(c => c.color?.startsWith('c'))).toBe(false)
      expect(SHAPES[name](input(-1))).toEqual(SHAPES[name](input(0)))
      expect(SHAPES[name](input(2))).toEqual(SHAPES[name](input(1)))
    }
  })
})

test('blocks fill in eighths on a solid track', () => {
  expect(chars('blocks', 0.24)).toBe('█▉      ')
  expect(chars('blocks', 0.25)).toBe('██      ')
  expect(SHAPES.blocks(input(0.24)).every(c => c.bg === 'T')).toBe(true)
})

test('glyph shapes use their on and off glyphs, off in the muted color', () => {
  expect(chars('shade', 0.5)).toBe('▓▓▓▓░░░░')
  expect(chars('slanted', 0.5)).toBe('▰▰▰▰▱▱▱▱')
  expect(chars('dots', 0.5)).toBe('●●●●○○○○')
  expect(chars('squares', 0.5)).toBe('■■■■□□□□')
  expect(chars('line', 0.5)).toBe('━━━━────')
  expect(chars('slashes', 0.5)).toBe('╱╱╱╱╱╱╱╱')
  expect(SHAPES.slashes(input(0.5))[6]?.color).toBe('M')
  expect(SHAPES.dots(input(0.5))[0]?.color).toBe('c0')
})

test('faded thins the end of the fill, and is solid when full', () => {
  expect(chars('faded', 0.5)).toBe('██▓▒    ')
  expect(chars('faded', 0.25)).toBe('█▓      ')
  expect(chars('faded', 1)).toBe('████████')
})

test('braille steps in half cells', () => {
  expect(chars('braille', 0.25)).toBe('⣿⣿⣀⣀⣀⣀⣀⣀')
  expect(chars('braille', 0.3125)).toBe('⣿⣿⡇⣀⣀⣀⣀⣀')
})

test('ascii wraps the bar in brackets', () => {
  expect(chars('ascii', 0.5)).toBe('[####----]')
})

test('pill and powerline caps take the color of the cell they touch', () => {
  const half = SHAPES.pill(input(0.5))
  expect(half[0]).toEqual({ char: '', color: 'c0' })
  expect(half[9]).toEqual({ char: '', color: 'T' })
  const full = SHAPES.powerline(input(1))
  expect(full[0]?.char).toBe('')
  expect(full[9]).toEqual({ char: '', color: 'c9' })
  expect(SHAPES.pill(input(0))[0]?.color).toBe('T')
})
