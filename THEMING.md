# Theme system

`src/styles/theme.css` is the single source of truth for the application palette.
The default is white, with opaque dark text and Kaka's `#ED4CA1` secondary accent.
`src/styles/base.css` owns layout, spacing, and typography, not palette values.
`src/assets/main.css` loads the layout stylesheet before the theme stylesheet.

## Switching themes

`src/App.vue` applies `light` or `dark` to the document root and persists the choice
under `kaka-theme-preference-v2`. The initial HTML uses `light` to prevent a dark
flash. Dark mode is explicit (`:root.dark`), not driven by the operating system.

## Component colors

Use `--color-bg` for the page, `--color-surface` for cards and dialogs,
`--color-surface-soft` for inset surfaces, and `--color-control` for inputs.
Use `--color-text` for primary text and `--color-muted` for supporting text.
Use `--color-border` for separators and `--color-accent` for brand highlights.
`--color-on-image` and `--color-on-action` provide white foregrounds where needed.
Keep photograph overlays, QR patterns, and third-party brand colors intentional.
Do not paint ordinary cards with fixed dark hex values or pale white text.

The dashboard's older `--bg-*`, `--t-*`, `--home-sidebar-*`, and `--metric-*`
variables alias these shared tokens; they must not own another neutral palette.
Both desktop and mobile cart styles, loading placeholders, and date/time dialogs
follow the same tokens. Theme changes must not change layout, copy, or data.

## Surface definition

Use `--shadow-subtle` for depth and `--shadow-elevated` for popovers: both are
intentionally almost imperceptible. Avoid literal heavy shadows and text glows.
Keyboard focus uses `--focus-ring` so focus remains visible independently of depth.
Separators use the low-opacity border tokens. The active dashboard navigation
item has a black background and white text/icons in both themes.
