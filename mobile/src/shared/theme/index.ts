export const lightColors = {
  primary: "#00f5ff",
  primaryDark: "#00c3cc",
  background: "#EAECEF", // Dimmed background
  surface: "#F2F4F7", // Dimmed surface
  text: "#000000", // Darker text
  textSecondary: "#374151", // Darker secondary text
  border: "#D1D5DB",
  error: "#ffb4ab",
  success: "#39ff14",
  warning: "#ff007f",
  cardShadow: "rgba(0, 0, 0, 0.1)",
  surfaceVariant: "#D1D5DB",
  secondary: "#374151",
  tertiary: "#6B7280",
  onPrimary: "#FFFFFF",
};

export const darkColors = {
  primary: "#00f5ff",
  primaryDark: "#00dce5",
  background: "#111318",
  surface: "rgba(255, 255, 255, 0.05)", // Glass effect base
  text: "#e2e2e8",
  textSecondary: "#b9caca",
  border: "rgba(255, 255, 255, 0.12)", // Highlight edge
  error: "#ffb4ab",
  success: "#39ff14",
  warning: "#ff007f",
  cardShadow: "rgba(0, 0, 0, 0.4)",
  surfaceVariant: "rgba(255, 255, 255, 0.08)",
  secondary: "#b9caca",
  tertiary: "#849495",
  onPrimary: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8, // Standard component
  md: 16, // Main dashboard cards
  lg: 24, // Overlay modals
  full: 999,
};

export type ThemeColors = typeof lightColors;
