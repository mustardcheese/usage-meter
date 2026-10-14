// Each theme gives the meter's four gradient stops (low → high usage), the
// track the empty part of a bar sits on, and a muted color for the empty
// glyphs, separators and reset times. Colors are the themes' own palette
// values; where a theme has no green or orange, its nearest accent stands in.
export type Theme = {
  green: string
  yellow: string
  orange: string
  red: string
  track: string
  muted: string
}

export const THEMES = {
  // The bright defaults, on an Everforest grey track.
  classic: { green: '#5fd75f', yellow: '#ffd75f', orange: '#ff8700', red: '#ff5f5f', track: '#56635f', muted: '#859289' },
  // Claude Code's own theme colors: follows its light/dark theme, stepped
  // rather than blended since theme keys cannot be mixed.
  terminal: { green: 'success', yellow: 'warning', orange: 'claude', red: 'error', track: 'inactive', muted: 'subtle' },

  'everforest-dark': { green: '#a7c080', yellow: '#dbbc7f', orange: '#e69875', red: '#e67e80', track: '#56635f', muted: '#859289' },
  'everforest-light': { green: '#8da101', yellow: '#dfa000', orange: '#f57d26', red: '#f85552', track: '#bdc3af', muted: '#939f91' },
  'gruvbox-dark': { green: '#b8bb26', yellow: '#fabd2f', orange: '#fe8019', red: '#fb4934', track: '#504945', muted: '#928374' },
  'gruvbox-light': { green: '#79740e', yellow: '#b57614', orange: '#af3a03', red: '#9d0006', track: '#d5c4a1', muted: '#928374' },
  'catppuccin-mocha': { green: '#a6e3a1', yellow: '#f9e2af', orange: '#fab387', red: '#f38ba8', track: '#45475a', muted: '#7f849c' },
  'catppuccin-macchiato': { green: '#a6da95', yellow: '#eed49f', orange: '#f5a97f', red: '#ed8796', track: '#494d64', muted: '#8087a2' },
  'catppuccin-frappe': { green: '#a6d189', yellow: '#e5c890', orange: '#ef9f76', red: '#e78284', track: '#51576d', muted: '#838ba7' },
  'catppuccin-latte': { green: '#40a02b', yellow: '#df8e1d', orange: '#fe640b', red: '#d20f39', track: '#bcc0cc', muted: '#8c8fa1' },
  'tokyo-night': { green: '#9ece6a', yellow: '#e0af68', orange: '#ff9e64', red: '#f7768e', track: '#3b4261', muted: '#565f89' },
  'tokyo-night-storm': { green: '#9ece6a', yellow: '#e0af68', orange: '#ff9e64', red: '#f7768e', track: '#414868', muted: '#565f89' },
  'tokyo-night-day': { green: '#587539', yellow: '#8c6c3e', orange: '#b15c00', red: '#f52a65', track: '#c4c8da', muted: '#848cb5' },
  'rose-pine': { green: '#9ccfd8', yellow: '#f6c177', orange: '#ebbcba', red: '#eb6f92', track: '#403d52', muted: '#6e6a86' },
  'rose-pine-moon': { green: '#9ccfd8', yellow: '#f6c177', orange: '#ea9a97', red: '#eb6f92', track: '#44415a', muted: '#6e6a86' },
  'rose-pine-dawn': { green: '#56949f', yellow: '#ea9d34', orange: '#d7827e', red: '#b4637a', track: '#dfdad9', muted: '#9893a5' },
  'solarized-dark': { green: '#859900', yellow: '#b58900', orange: '#cb4b16', red: '#dc322f', track: '#073642', muted: '#586e75' },
  'solarized-light': { green: '#859900', yellow: '#b58900', orange: '#cb4b16', red: '#dc322f', track: '#eee8d5', muted: '#93a1a1' },
  nord: { green: '#a3be8c', yellow: '#ebcb8b', orange: '#d08770', red: '#bf616a', track: '#434c5e', muted: '#616e88' },
  dracula: { green: '#50fa7b', yellow: '#f1fa8c', orange: '#ffb86c', red: '#ff5555', track: '#44475a', muted: '#6272a4' },
  'one-dark': { green: '#98c379', yellow: '#e5c07b', orange: '#d19a66', red: '#e06c75', track: '#3e4452', muted: '#5c6370' },
  kanagawa: { green: '#98bb6c', yellow: '#e6c384', orange: '#ffa066', red: '#e46876', track: '#363646', muted: '#727169' },
  monokai: { green: '#a6e22e', yellow: '#e6db74', orange: '#fd971f', red: '#f92672', track: '#49483e', muted: '#75715e' },
  'ayu-dark': { green: '#aad94c', yellow: '#e6b450', orange: '#ff8f40', red: '#f07178', track: '#2d3640', muted: '#565b66' },
  nightfox: { green: '#81b29a', yellow: '#dbc074', orange: '#f4a261', red: '#c94f6d', track: '#39506d', muted: '#738091' },
} satisfies Record<string, Theme>

export type ThemeName = keyof typeof THEMES

export const THEME_NAMES = Object.keys(THEMES) as ThemeName[]

export function isHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color)
}
