# UI Theme & Guidelines

## Design System: "Luminous Ledger"
The application uses a unified, dynamic design system that heavily relies on **Glassmorphism**, neon-glow accents, and a dark-mode-first aesthetic (though fully supporting a dimmed light mode).

## Core Principles
1. **Glassmorphism**: UI cards and elements use `expo-blur` or semi-transparent RGBA backgrounds with subtle white borders (`rgba(255, 255, 255, 0.12)`) to create depth and a frosted glass effect.
2. **Neon Accents**: Active states, buttons, and important text use vibrant primary/secondary colors that feature a "glow" (achieved via text/box shadows).
3. **Dynamic Theming**: The app supports both Light and Dark mode using a unified `useThemeStore` that persists the user's choice to AsyncStorage. Light mode uses dimmed, subtle colors to avoid high contrast glare.

## Typography
- **Primary / Body Font:** `Hanken Grotesk` (clean, modern, sans-serif).
- **Secondary / Monospace Font:** `JetBrains Mono` (used for numbers, amounts, labels, and technical data to ensure alignment and readability).
- `expo-font` is used to load these Google Fonts.

## Color Palette Tokens
| Token | Dark Mode (Default) | Light Mode |
|-------|---------------------|------------|
| `background` | `#0f1115` | `#e8ecef` |
| `surface` | `#1a1d24` | `#d8dee3` |
| `primary` | `#00f5ff` (Cyan) | `#008b99` |
| `secondary` | `#ff007f` (Pink) | `#cc0066` |
| `success` | `#00ff9d` | `#00b36e` |
| `warning` | `#ffb700` | `#cc9200` |
| `error` | `#ff3366` | `#cc2952` |
| `text` | `#ffffff` | `#1a1d24` |
| `textSecondary` | `#8b949e` | `#5c636a` |
| `border` | `#2d3139` | `#c0c7cd` |
