import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { useTheme } from "@/shared/hooks/useTheme";

export function SplashScreen() {
  const { colors } = useTheme();
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Smart Expense</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Personal & Group Finance Manager
      </Text>
      <ActivityIndicator color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 8 },
  loader: { marginTop: 32 },
});
