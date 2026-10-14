# usage-meter

A Claude Code mod that shows your subscription usage and context size as colored bars at the bottom of the screen, on the mode line under the prompt.

```
⏵⏵ auto mode on (shift+tab to cycle)     5h ███▌░░░░ 44% 2h0m │ 7d █▉░░░░░░ 24% 3d4h │ ctx █▎░░░░░░ 150k
```

- **5h**: the 5-hour usage block, with time until it resets
- **7d**: the weekly limit (plus any model-specific weekly limits your plan reports), with time until it resets
- **ctx**: the session's context size

Bars blend green → yellow → orange → red as they fill. The 5h and 7d bars only appear on a Claude subscription. The numbers update after each reply.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install usage-meter --marketplace mustardcheese/usage-meter
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```
claude plugin install usage-meter --marketplace mustardcheese/usage-meter
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `mustardcheese/usage-meter`, then Add plugin.

## Customizing

Everything is in `/config` under usage-meter, and applies as soon as you change it.

### Theme

`classic` (default: bright colors on a grey track), `terminal` (follows Claude Code's own theme), `everforest-dark`, `everforest-light`, `gruvbox-dark`, `gruvbox-light`, `catppuccin-mocha`, `catppuccin-macchiato`, `catppuccin-frappe`, `catppuccin-latte`, `tokyo-night`, `tokyo-night-storm`, `tokyo-night-day`, `rose-pine`, `rose-pine-moon`, `rose-pine-dawn`, `solarized-dark`, `solarized-light`, `nord`, `dracula`, `one-dark`, `kanagawa`, `monokai`, `ayu-dark`, `nightfox`.

**Color: green / yellow / orange / red / track** take a hex value (`#fb4934`) to replace one of the theme's colors; leave them empty to keep the theme's.

### Bar shape

```
blocks    █████▍           eighths of a cell, the smoothest
shade     ▓▓▓▓▓░░░
faded     ███▓▒
slanted   ▰▰▰▰▰▱▱▱
slashes   ╱╱╱╱╱╱╱╱
dots      ●●●●●○○○
squares   ■■■■■□□□
line      ━━━━━───
braille   ⣿⣿⣿⣿⣿⡇⣀⣀         half-cell steps
ascii     [#####---]
pill      █████        needs a Nerd Font
powerline █████        needs a Nerd Font
```

**Fill**: `gradient` colors each cell by its place along the bar; `solid` colors the whole fill by its level.

**Bar width**: cells per bar; `0` sizes them to the terminal (8 at 160+ columns, 6 at 120+, 4 below).

### Text

| Setting | Default | |
| --- | --- | --- |
| 5-hour label | `5h` | empty hides the label |
| 7-day label | `7d` | extra weekly limits add their model: `7d opus` |
| Context label | `ctx` | |
| Separator | `│` | drawn with a space each side |
| Reset time | `countdown` | `countdown` (2h0m), `clock` (14:00, or `Thu 10:00` past a day), `off` |
| Context shows | `tokens` | `tokens` (150k), `percent` (15%), `both` |
| Show 5-hour / 7-day / context | on | |

### Color points

| Setting | Default |
| --- | --- |
| Usage yellow / orange / red at (%) | 50 / 70 / 85 |
| Context yellow / orange / red at (k tokens) | 250 / 350 / 500 |

The context bar is full at its red point. Points out of order fall back to the defaults.

## Updating

```
claude plugin update usage-meter
```

then `/reload-plugins` in a running session.

## Developing

```
claude --plugin-dir .
```

loads the mod from this folder and reloads it on save. Claude Code writes the API's type declarations to `.claude-plugin/types/` when it loads the mod, so `tsc -p .` type-checks it after that.

```
claude plugin validate .
claude plugin test .
```

| File | |
| --- | --- |
| `hooks/register.tsx` | hooks and drawing |
| `hooks/options.ts` | reads `/config` values, with fallbacks |
| `hooks/themes.ts` | color schemes |
| `hooks/shapes.ts` | bar shapes |
