# UI Theme & Guidelines

## General Principles
- The app should feel modern, clean, and fast.
- UI elements should handle edge cases (e.g., long names, varying screen sizes).
- Use `react-native-safe-area-context` to ensure the UI does not overlap with the device notch or status bar.

## Colors
*(To be strictly defined as we build out the UI)*
- **Primary:** TBD
- **Background:** Light/Dark mode responsive (`expo-system-ui` manages root background colors to prevent flickering).
- **Error States:** Standard red (e.g., used in the custom ErrorBoundary).

## Typography
- System fonts are used by default. 
- `expo-font` is installed and properly locked to SDK 54 (`~14.0.x`). Avoid upgrading this package independently as it causes native crashes.
