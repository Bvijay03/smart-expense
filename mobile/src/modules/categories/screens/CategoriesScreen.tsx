import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoryService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { getErrorMessage } from "@/shared/services/api";

const COLOR_OPTIONS = [
  "#4F46E5", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4",
  "#8B5CF6", "#EC4899", "#14B8A6", "#64748B", "#D946EF",
];

export function CategoriesScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((r) => r.data.data),
  });

  const addCategory = useMutation({
    mutationFn: () => categoryService.create({ name: newName.trim(), color: selectedColor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDelete = (id: string, name: string) => {
    Alert.alert("Delete Category", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteCategory.mutate(id) },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load categories" onRetry={refetch} />;

  const defaults = data?.filter((c) => c.isDefault) ?? [];
  const custom = data?.filter((c) => !c.isDefault) ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Categories" subtitle="Manage expense categories" />

      {/* Add new category */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Custom Category</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="Category name..."
            placeholderTextColor={colors.textSecondary}
            value={newName}
            onChangeText={setNewName}
            returnKeyType="done"
            onSubmitEditing={() => newName.trim() && addCategory.mutate()}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary, opacity: newName.trim() ? 1 : 0.4 }]}
            onPress={() => newName.trim() && addCategory.mutate()}
            disabled={!newName.trim() || addCategory.isPending}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.colorRow}>
          {COLOR_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                selectedColor === c && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(c)}
            />
          ))}
        </View>
      </Card>

      {/* Custom categories */}
      {custom.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>
            Custom ({custom.length})
          </Text>
          {custom.map((cat) => (
            <Card key={cat.id}>
              <View style={styles.catRow}>
                <View style={[styles.catIcon, { backgroundColor: cat.color + "18" }]}>
                  <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                </View>
                <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                <TouchableOpacity
                  onPress={() => confirmDelete(cat.id, cat.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Default categories */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.md }]}>
        Default ({defaults.length})
      </Text>
      {defaults.map((cat) => (
        <Card key={cat.id}>
          <View style={styles.catRow}>
            <View style={[styles.catIcon, { backgroundColor: cat.color + "18" }]}>
              <Ionicons name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
            <View style={[styles.defaultBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.defaultBadgeText, { color: colors.textSecondary }]}>Default</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  addRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  input: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  addBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  catRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: 15, fontWeight: "600" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  defaultBadgeText: { fontSize: 11, fontWeight: "500" },
});
