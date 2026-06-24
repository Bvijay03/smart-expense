import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "@/shared/navigation/RootNavigator";
import { useThemeStore } from "@/shared/hooks/useTheme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
        <StatusBar style={isDark ? "light" : "dark"} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
