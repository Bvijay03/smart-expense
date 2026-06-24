import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { spacing } from "@/shared/theme";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { colors, isDark, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Profile" subtitle="Account settings" />

      <Card>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>
          Email
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
      </Card>

      <Button
        title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
        variant="secondary"
        onPress={toggleTheme}
      />

      <View style={styles.spacer} />
      <Button title="Logout" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  label: { fontSize: 13 },
  value: { fontSize: 17, fontWeight: "600" },
  spacer: { height: spacing.md },
});
