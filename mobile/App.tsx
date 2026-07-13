import { Component, ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "@/shared/navigation/RootNavigator";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { View, Text, ScrollView, StyleSheet } from "react-native";

// ─── Error Boundary ────────────────────────────────────────────────────────
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <ScrollView contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ App Startup Error</Text>
          <Text style={styles.errorName}>{err.name}: {err.message}</Text>
          <Text style={styles.errorStack}>{err.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: { padding: 20, paddingTop: 60, backgroundColor: "#1a0000", minHeight: "100%" },
  errorTitle: { color: "#ff6b6b", fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  errorName: { color: "#ffaaaa", fontSize: 14, marginBottom: 16 },
  errorStack: { color: "#ff9999", fontSize: 11, fontFamily: "monospace" },
});

// ─── App ───────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
          <StatusBar style={isDark ? "light" : "dark"} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
