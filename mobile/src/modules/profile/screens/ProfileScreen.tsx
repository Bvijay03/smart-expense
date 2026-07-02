import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { getErrorMessage } from "@/shared/services/api";
import { api } from "@/shared/services/api";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const { colors, isDark, toggleTheme } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");

  const updateName = useMutation({
    mutationFn: (name: string) => api.patch("/users/me", { name }),
    onSuccess: (res) => {
      setUser({ ...user!, name: res.data.data.name });
      setEditingName(false);
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

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
        {/* Name Row */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name</Text>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => nameInput.trim() && updateName.mutate(nameInput.trim())}
            />
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.primary }]}
              onPress={() => nameInput.trim() && updateName.mutate(nameInput.trim())}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => { setEditingName(false); setNameInput(user?.name ?? ""); }}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
            <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
            <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Email (read-only) */}
        <Text style={[styles.label, { color: colors.textSecondary, marginTop: spacing.md }]}>Email</Text>
        <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
      </Card>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate("Categories")}
        >
          <Ionicons name="pricetag-outline" size={24} color="#F59E0B" />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate("Recurring")}
        >
          <Ionicons name="repeat-outline" size={24} color="#8B5CF6" />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Recurring</Text>
        </TouchableOpacity>
      </View>

      <Button
        title={isDark ? "☀️  Switch to Light Theme" : "🌙  Switch to Dark Theme"}
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
  value: { fontSize: 17, fontWeight: "600", marginTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  nameInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  spacer: { height: spacing.md },

  // Manage section
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: spacing.md, marginBottom: spacing.sm },
  actionGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actionCard: {
    flex: 1, alignItems: "center", paddingVertical: 18,
    borderRadius: 14, borderWidth: 1, gap: 6,
  },
  actionLabel: { fontSize: 13, fontWeight: "600" },
});

