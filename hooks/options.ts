import type { PluginOptions } from 'claude-code'

import { SHAPE_NAMES, type ShapeName } from './shapes'
import { isHex, THEME_NAMES, THEMES, type Theme, type ThemeName } from './themes'

export type Config = {
  theme: Theme
  shape: ShapeName
  fill: 'gradient' | 'solid'
  reset: 'countdown' | 'clock' | 'off'
  contextShows: 'tokens' | 'percent' | 'both'
  labels: { fiveHour: string; sevenDay: string; context: string }
  separator: string
  // Where yellow, orange and red sit: percent for the limits, tokens for context.
  usageStops: [number, number, number]
  contextStops: [number, number, number]
  // 0: sized to the terminal.
  width: number
  show: { fiveHour: boolean; sevenDay: boolean; context: boolean }
}

export const DEFAULTS = {
  theme: 'classic',
  shape: 'blocks',
  fill: 'gradient',
  resetTime: 'countdown',
  contextShows: 'tokens',
  label5h: '5h',
  label7d: '7d',
  labelContext: 'ctx',
  separator: '│',
  usageYellowAt: 50,
  usageOrangeAt: 70,
  usageRedAt: 85,
  ctxYellowK: 250,
  ctxOrangeK: 350,
  ctxRedK: 500,
  barWidth: 0,
  show5h: true,
  show7d: true,
  showContext: true,
} as const

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

// Three ascending positive stops, else the defaults: a red point under the
// yellow one would draw nonsense.
function stops(values: unknown[], fallback: [number, number, number]): [number, number, number] {
  const [y, o, r] = values.map((v, i) => (typeof v === 'number' && v > 0 ? v : fallback[i]!))
  return y! < o! && o! < r! ? [y!, o!, r!] : fallback
}

// A hex override replaces the theme's color; blank or malformed keeps it.
function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && isHex(value.trim()) ? value.trim() : fallback
}

export function readConfig(options: PluginOptions): Config {
  const base = THEMES[pick<ThemeName>(options.theme, THEME_NAMES, DEFAULTS.theme)]
  const width = options.barWidth

  return {
    theme: {
      green: color(options.colorGreen, base.green),
      yellow: color(options.colorYellow, base.yellow),
      orange: color(options.colorOrange, base.orange),
      red: color(options.colorRed, base.red),
      track: color(options.colorTrack, base.track),
      muted: base.muted,
    },
    shape: pick(options.shape, SHAPE_NAMES, DEFAULTS.shape),
    fill: pick(options.fill, ['gradient', 'solid'] as const, DEFAULTS.fill),
    reset: pick(options.resetTime, ['countdown', 'clock', 'off'] as const, DEFAULTS.resetTime),
    contextShows: pick(options.contextShows, ['tokens', 'percent', 'both'] as const, DEFAULTS.contextShows),
    labels: {
      fiveHour: text(options.label5h, DEFAULTS.label5h),
      sevenDay: text(options.label7d, DEFAULTS.label7d),
      context: text(options.labelContext, DEFAULTS.labelContext),
    },
    separator: text(options.separator, DEFAULTS.separator).trim(),
    usageStops: stops(
      [options.usageYellowAt, options.usageOrangeAt, options.usageRedAt],
      [DEFAULTS.usageYellowAt, DEFAULTS.usageOrangeAt, DEFAULTS.usageRedAt],
    ),
    contextStops: stops([options.ctxYellowK, options.ctxOrangeK, options.ctxRedK], [
      DEFAULTS.ctxYellowK,
      DEFAULTS.ctxOrangeK,
      DEFAULTS.ctxRedK,
    ]).map(k => k * 1000) as [number, number, number],
    width: typeof width === 'number' && width > 0 ? Math.min(40, Math.round(width)) : 0,
    show: {
      fiveHour: flag(options.show5h, DEFAULTS.show5h),
      sevenDay: flag(options.show7d, DEFAULTS.show7d),
      context: flag(options.showContext, DEFAULTS.showContext),
    },
  }
}
