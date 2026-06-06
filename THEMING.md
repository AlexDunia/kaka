# Theming System

## Overview

This project now has a shared Light/Dark theming system. Dark mode is the default experience, and all colors across major components now reference the CSS custom properties declared in `:root`. Light mode is toggled simply by adding or removing the `.light` class on the `<html>` element, so components only need to listen to the same set of variables — they do not care which theme is currently active.

## Variables

`src/App.vue` defines the base palette:

```css
:root {
  --color-primary: #22c55e;
  --color-accent: #ec4899;
  --color-bg: #0b0f19;
  --color-surface: #111827;
  --color-text: #ffffff;
  --color-muted: #9ca3af;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-card-border: rgba(255, 255, 255, 0.05);
  --color-shadow: rgba(0, 0, 0, 0.35);
  --color-tab-bg: rgba(255, 255, 255, 0.06);
  --color-tab-border: rgba(255, 255, 255, 0.04);
  --color-hero-label: rgba(255, 255, 255, 0.75);
  --color-hero-subtitle: rgba(255, 255, 255, 0.85);
  --color-search-field: rgba(37, 35, 45, 0.4);
}

.light {
  --color-bg: #ffffff;
  --color-surface: #f3f4f6;
  --color-text: #111827;
  --color-muted: #6b7280;
  --color-border: rgba(17, 24, 39, 0.2);
  --color-card-border: rgba(203, 213, 224, 0.4);
  --color-shadow: rgba(0, 0, 0, 0.1);
  --color-tab-bg: rgba(15, 23, 42, 0.12);
}
```

Brand colors (`--color-primary`, `--color-accent`) are intentionally kept constant; they are used for the date badge, prices, and the pill accents, so they never change between themes. Theme-specific colors (background, surface, text, muted, border, shadow) are the ones that update when `.light` is present.

## Toggle behavior

- The App-level state maintains a `theme` ref (`dark`/`light`) and exposes `toggleTheme`.
- On `onMounted`, we call `initializeTheme`, which checks `localStorage` and falls back to `prefers-color-scheme`, then applies the result via `document.documentElement.classList.toggle('light', ...)`.
- Clicking the header button toggles between the two and persists the selection in `localStorage`, while the button text/icon reflects the current mode.

## Component usage rules

- Always consume colors through the variables above (e.g., `background-color: var(--color-surface); color: var(--color-text);`).
- Use `--color-primary` and `--color-accent` whenever the brand green/pink are needed; these should never change even in `.light`.
- If you need a one-off shade (like the search bar background), create a descriptive variable (e.g., `--color-search-field`) under `:root` so the value is centralized.
- For elements that must stay on-brand regardless of theme (like the pink static strip at the bottom of HomePage), rely on fixed literals or separate CSS since those colors should not respond to the `.light` class.

## Extending safely

1. Add new semantic tokens to `:root` (and override in `.light` only if the value should change).
2. Reference those tokens in components. When adding new components, prefer theme-aware values for backgrounds/borders/text, and reserve brand tokens for logos/badges/prices.
3. Keep UI logic (like the navbar toggle) scoped to `App.vue`. If you need to read the current theme elsewhere, you can derive it from `document.documentElement.classList.contains('light')`, but prefer passing props or using Pinia if global sync is required.
