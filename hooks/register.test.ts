import type { RenderElement, SessionMeasureInput } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { readConfig } from './options'
import { bar, colorAt, resetText, type Scale } from './register'
import { THEMES } from './themes'

const NOW = Date.parse('2026-10-14T12:00:00Z')
const USAGE: Scale = { stops: [0, 50, 70, 85], max: 100 }

const FOOTER = {
  plugin: 'usage-meter',
  component: 'SessionMode',
  props: { modes: [] as string[] },
  viewport: { columns: 160, rows: 40 },
} as const

const MEASURE = {
  context: { tokens: 150_000, window: 1_000_000, percent: 15 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 62, resetsAt: new Date(NOW + 2 * 3_600_000).toISOString() },
    { kind: 'seven_day', percentUsed: 24, resetsAt: new Date(NOW + 3 * 86_400_000).toISOString() },
    { kind: 'seven_day_opus', percentUsed: 90 },
  ],
  changed: ['context', 'rateLimits'],
} satisfies SessionMeasureInput

const texts = async (ui: { findAll: (q: { type: string }) => Promise<{ text: string; children: unknown[] }[]> }) =>
  (await ui.findAll({ type: 'Text' })).filter(t => t.children.every(c => typeof c === 'string')).map(t => t.text)

test('the gradient blends between stops on hex themes and steps on terminal', () => {
  const t = THEMES.classic
  expect(colorAt(0, USAGE, t)).toBe('#5fd75f')
  expect(colorAt(50, USAGE, t)).toBe('#ffd75f')
  expect(colorAt(60, USAGE, t)).toBe('#ffaf30')
  expect(colorAt(85, USAGE, t)).toBe('#ff5f5f')
  expect(colorAt(100, USAGE, t)).toBe('#ff5f5f')
  expect(colorAt(30, USAGE, THEMES.terminal)).toBe('success')
  expect(colorAt(75, USAGE, THEMES.terminal)).toBe('claude')
  expect(colorAt(95, USAGE, THEMES.terminal)).toBe('error')
})

test('solid fill colors every cell for the fill level; gradient by place', () => {
  const solid = bar(60, 8, USAGE, readConfig({ fill: 'solid' }))
  expect(new Set(solid.filter(c => c.char !== ' ').map(c => c.color))).toEqual(new Set(['#ffaf30']))
  const gradient = bar(60, 8, USAGE, readConfig({}))
  expect(gradient[0]?.color).toBe('#73d75f')
})

test('reset times: countdown, clock (weekday past a day), off', () => {
  const in2h = new Date(NOW + 2 * 3_600_000 + 5 * 60_000).toISOString()
  const in3d = new Date(NOW + 3 * 86_400_000).toISOString()
  expect(resetText(in2h, NOW, 'countdown')).toBe('2h5m')
  expect(resetText(in3d, NOW, 'countdown')).toBe('3d0h')
  const local = new Date(Date.parse(in2h))
  const hhmm = `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`
  expect(resetText(in2h, NOW, 'clock')).toBe(hhmm)
  expect(resetText(in3d, NOW, 'clock')).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d\d:\d\d$/)
  expect(resetText(in2h, NOW, 'off')).toBeUndefined()
})

test('shows dashes before any reading', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...FOOTER, surface })
    expect(await texts(ui)).toEqual(expect.arrayContaining(['ctx ', ' --']))
    await ui.unmount()
  }
})

test('defaults: labels, countdowns, tokens and theme colors on every surface', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  await $.session.measure(MEASURE)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...FOOTER, surface })
    const t = await texts(ui)
    expect(t).toEqual(expect.arrayContaining(['5h ', '7d ', '7d opus ', 'ctx ', ' 2h0m', ' 3d0h', ' 150k', ' │ ']))
    expect((await ui.find({ type: 'Text', text: /^ 90%$/ }))?.props.color).toBe('#ff5f5f')
    expect((await ui.find({ type: 'Text', text: /^ 24%$/ }))?.props.color).toBe(colorAt(24, USAGE, THEMES.classic))
    await ui.unmount()
  }
})

test(
  'settings reach the drawn line: labels, separator, toggles, reset, context, theme, shape',
  {
    options: {
      theme: 'gruvbox-dark',
      shape: 'dots',
      label5h: 'session',
      separator: '•',
      show7d: false,
      resetTime: 'off',
      contextShows: 'both',
      ctxYellowK: 50,
      ctxOrangeK: 100,
      ctxRedK: 150,
    },
  },
  async ($, on) => {
    mock.clock(on, { now: NOW })
    on('session.measure', (_$, e) => ({ changed: e.changed }))
    await $.session.measure(MEASURE)

    const ui = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
    const t = await texts(ui)
    expect(t).toEqual(expect.arrayContaining(['session ', ' • ', ' 150k 15%']))
    expect(t).not.toContain('7d ')
    expect(t).not.toContain(' 2h0m')
    expect(t).toContain('●')
    expect((await ui.find({ type: 'Text', text: /^ 150k 15%$/ }))?.props.color).toBe(THEMES['gruvbox-dark'].red)
    await ui.unmount()
  },
)

test('an empty label draws the bar alone', { options: { labelContext: '' } }, async $ => {
  const ui = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  const t = await texts(ui)
  expect(t).not.toContain('ctx ')
  expect(t).toContain(' --')
  await ui.unmount()
})

test('with every meter hidden the engine keeps its row', { options: { showContext: false } }, async ($, on) => {
  on('ui.render', { component: 'SessionMode' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return h(Text, {}, 'engine') as RenderElement
  })
  const ui = await $.ui.mount({ ...FOOTER, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
  await ui.unmount()
})

test("keeps the engine's mode labels in front", async $ => {
  const ui = await $.ui.mount({ ...FOOTER, surface: 'terminal', props: { modes: ['focus', 'memory paused'] } })
  expect(await ui.find({ type: 'Text', text: 'focus & memory paused │ ' })).toBeDefined()
  await ui.unmount()
})
