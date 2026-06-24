import { create } from "zustand";
import { lightColors, darkColors, ThemeColors } from "@/shared/theme";

interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: false,
  colors: lightColors,
  toggleTheme: () =>
    set((state) => ({
      isDark: !state.isDark,
      colors: state.isDark ? lightColors : darkColors,
    })),
}));
