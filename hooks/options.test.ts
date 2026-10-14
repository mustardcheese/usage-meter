import { expect, test } from 'claude-code/testing'

import { readConfig } from './options'
import { isHex, THEME_NAMES, THEMES } from './themes'

test('every theme but terminal is all hex; terminal names theme keys', () => {
  for (const name of THEME_NAMES) {
    const colors = Object.values(THEMES[name])
    if (name === 'terminal') expect(colors.some(isHex)).toBe(false)
    else expect(colors.every(isHex)).toBe(true)
  }
})

test('no options gives the defaults', () => {
  const c = readConfig({})
  expect(c.theme).toEqual(THEMES.classic)
  expect(c.shape).toBe('blocks')
  expect(c.fill).toBe('gradient')
  expect(c.reset).toBe('countdown')
  expect(c.contextShows).toBe('tokens')
  expect(c.labels).toEqual({ fiveHour: '5h', sevenDay: '7d', context: 'ctx' })
  expect(c.separator).toBe('│')
  expect(c.usageStops).toEqual([50, 70, 85])
  expect(c.contextStops).toEqual([250_000, 350_000, 500_000])
  expect(c.width).toBe(0)
  expect(c.show).toEqual({ fiveHour: true, sevenDay: true, context: true })
})

test('picks, labels, toggles and stops are read', () => {
  const c = readConfig({
    theme: 'gruvbox-dark',
    shape: 'slanted',
    fill: 'solid',
    resetTime: 'clock',
    contextShows: 'both',
    label5h: 'session',
    label7d: '',
    separator: ' • ',
    usageYellowAt: 40,
    usageOrangeAt: 60,
    usageRedAt: 80,
    ctxYellowK: 100,
    ctxOrangeK: 150,
    ctxRedK: 200,
    barWidth: 12,
    show7d: false,
  })
  expect(c.theme).toEqual(THEMES['gruvbox-dark'])
  expect([c.shape, c.fill, c.reset, c.contextShows]).toEqual(['slanted', 'solid', 'clock', 'both'])
  expect(c.labels).toEqual({ fiveHour: 'session', sevenDay: '', context: 'ctx' })
  expect(c.separator).toBe('•')
  expect(c.usageStops).toEqual([40, 60, 80])
  expect(c.contextStops).toEqual([100_000, 150_000, 200_000])
  expect(c.width).toBe(12)
  expect(c.show.sevenDay).toBe(false)
})

test('hex overrides replace theme colors; blank or malformed ones keep them', () => {
  const c = readConfig({ theme: 'nord', colorRed: ' #ff0000 ', colorTrack: '#123456', colorGreen: 'green', colorYellow: '' })
  expect(c.theme.red).toBe('#ff0000')
  expect(c.theme.track).toBe('#123456')
  expect(c.theme.green).toBe(THEMES.nord.green)
  expect(c.theme.yellow).toBe(THEMES.nord.yellow)
})

test('unknown picks and out-of-order stops fall back', () => {
  const c = readConfig({ theme: 'nope', shape: 'zigzag', usageYellowAt: 90, ctxRedK: -5, barWidth: 99 })
  expect(c.theme).toEqual(THEMES.classic)
  expect(c.shape).toBe('blocks')
  expect(c.usageStops).toEqual([50, 70, 85])
  expect(c.contextStops).toEqual([250_000, 350_000, 500_000])
  expect(c.width).toBe(40)
})
