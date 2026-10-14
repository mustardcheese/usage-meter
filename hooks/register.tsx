import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Snapshot } from '../types'
import { type Config, readConfig } from './options'
import { type Cell, SHAPES } from './shapes'
import { isHex, type Theme } from './themes'

const snapshot = atom({ plugin: 'usage-meter', key: 'snapshot' } as const, {
  contextWindow: 0,
  limits: [],
  at: 0,
} as Snapshot)

// Where each color sits on a meter's scale (green at 0), and where its bar is
// full: 100% for a limit, the red point for context.
export type Scale = { stops: [number, number, number, number]; max: number }

// Green → yellow → orange → red, blended between stops. A theme that names
// theme keys instead of hex (`terminal`) cannot be blended, so it steps.
export function colorAt(value: number, scale: Scale, theme: Theme): string {
  const colors = [theme.green, theme.yellow, theme.orange, theme.red]
  const { stops } = scale
  const v = Math.max(0, value)
  let i = 0
  while (i < stops.length - 2 && v >= stops[i + 1]!) i++
  const t = Math.min(1, (v - stops[i]!) / (stops[i + 1]! - stops[i]!))
  const [c0, c1] = [colors[i]!, colors[i + 1]!]
  if (!isHex(c0) || !isHex(c1)) return t >= 1 ? c1 : c0
  const rgb = (c: string) => [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16))
  const [a, b] = [rgb(c0), rgb(c1)]
  return '#' + a.map((x, k) => Math.round(x + (b[k]! - x) * t).toString(16).padStart(2, '0')).join('')
}

export function bar(value: number, width: number, scale: Scale, config: Config): Cell[] {
  const solid = colorAt(value, scale, config.theme)
  return SHAPES[config.shape]({
    fill: Math.min(scale.max, Math.max(0, value)) / scale.max,
    width,
    colorAt: place => (config.fill === 'solid' ? solid : colorAt(place * scale.max, scale, config.theme)),
    track: config.theme.track,
    muted: config.theme.muted,
  })
}

export function tokens(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${Math.round(n / 1000)}k`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function resetText(resetsAt: string | undefined, now: number, format: Config['reset']): string | undefined {
  if (resetsAt === undefined || format === 'off') return undefined
  const at = Date.parse(resetsAt)
  if (format === 'clock') {
    const d = new Date(at)
    const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    return at - now >= 86_400_000 ? `${DAYS[d.getDay()]} ${hhmm}` : hhmm
  }
  const mins = Math.max(0, Math.round((at - now) / 60_000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d${h}h`
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

function labelOf(kind: string, config: Config): string {
  if (kind === 'five_hour') return config.labels.fiveHour
  if (kind === 'seven_day') return config.labels.sevenDay
  if (kind.startsWith('seven_day_')) return `${config.labels.sevenDay} ${kind.slice('seven_day_'.length)}`.trim()
  if (kind === 'spend_limit') return 'spend'
  return kind
}

function isShown(kind: string, config: Config): boolean {
  if (kind === 'five_hour') return config.show.fiveHour
  if (kind.startsWith('seven_day')) return config.show.sevenDay
  return true
}

function toSnapshot(context: SessionContextUsage, limits: SessionRateLimit[], at: number): Snapshot {
  return {
    contextTokens: context.tokens,
    contextWindow: context.window,
    contextPercent: context.percent,
    limits: limits.map(({ kind, percentUsed, resetsAt }) => ({ kind, percentUsed, resetsAt })),
    at,
  }
}

type Meter = { key: string; name: string; value?: number; text?: string; scale: Scale; sub?: string }

export function meters(s: Snapshot, config: Config): Meter[] {
  const usage: Scale = { stops: [0, ...config.usageStops], max: 100 }
  const context: Scale = { stops: [0, ...config.contextStops], max: config.contextStops[2] }
  const ctxText = (() => {
    if (s.contextTokens === undefined) return undefined
    const pct = `${s.contextPercent ?? Math.round((s.contextTokens / Math.max(1, s.contextWindow)) * 100)}%`
    if (config.contextShows === 'percent') return pct
    if (config.contextShows === 'both') return `${tokens(s.contextTokens)} ${pct}`
    return tokens(s.contextTokens)
  })()

  return [
    ...s.limits
      .filter(l => isShown(l.kind, config))
      .map(l => ({
        key: l.kind,
        name: labelOf(l.kind, config),
        value: l.percentUsed,
        text: `${Math.round(l.percentUsed)}%`,
        scale: usage,
        sub: resetText(l.resetsAt, s.at, config.reset),
      })),
    ...(config.show.context
      ? [{ key: 'context', name: config.labels.context, value: s.contextTokens, text: ctxText, scale: context }]
      : []),
  ]
}

export const register: Register = (on, options) => {
  const config = readConfig(options)

  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    const now = await $.clock.now()
    await update($, snapshot, () => toSnapshot(usage.context, usage.rateLimits, now))
    $.clock.every(60_000, () => {
      void $.clock.now().then(at => update($, snapshot, s => ({ ...s, at })))
    })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const now = await $.clock.now()
    await update($, snapshot, () => toSnapshot(e.context, e.rateLimits, now))

    return next(e)
  })

  // The right end of the footer row (where the engine's mode labels sit):
  // 5h ███▍    62% 2h0m │ 7d … │ ctx ██▏     162k, after any labels the engine shows.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const { Text } = $.ui.resolve(e)
    const s = await read($, snapshot)
    const list = meters(s, config)
    if (list.length === 0) return next(e)

    // The row is shared with the hint line on the left, so the bars stay short.
    const columns = e.viewport?.columns ?? 100
    const width = config.width || (columns >= 160 ? 8 : columns >= 120 ? 6 : 4)
    const sep = config.separator ? ` ${config.separator} ` : '  '
    const muted = config.theme.muted

    return (
      <Text>
        {e.props.modes.length > 0 && <Text color={muted}>{`${e.props.modes.join(' & ')}${sep}`}</Text>}
        {list.map((m, i) => (
          <Text key={m.key}>
            {i > 0 && <Text color={muted}>{sep}</Text>}
            {m.name !== '' && <Text>{`${m.name} `}</Text>}
            {m.value === undefined ? (
              <Text>
                {bar(0, width, m.scale, config).map(c => (
                  <Text color={c.color} backgroundColor={c.bg}>
                    {c.char}
                  </Text>
                ))}
                <Text color={muted}>{' --'}</Text>
              </Text>
            ) : (
              <Text>
                {bar(m.value, width, m.scale, config).map(c => (
                  <Text color={c.color} backgroundColor={c.bg}>
                    {c.char}
                  </Text>
                ))}
                <Text color={colorAt(m.value, m.scale, config.theme)}>{` ${m.text}`}</Text>
              </Text>
            )}
            {m.sub !== undefined && <Text color={muted}>{` ${m.sub}`}</Text>}
          </Text>
        ))}
      </Text>
    )
  })
}
