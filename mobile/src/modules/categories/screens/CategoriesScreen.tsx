import { useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { categoryService, expenseService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { getErrorMessage } from "@/shared/services/api";

const { width } = Dimensions.get("window");
// 2 columns with gaps
const CARD_WIDTH = (width - spacing.md * 2 - spacing.sm) / 2;

const COLOR_OPTIONS = [
  "#4F46E5", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4",
  "#8B5CF6", "#EC4899", "#14B8A6", "#64748B", "#D946EF",
];

export function CategoriesScreen() {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  const [isModalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.list().then((r) => r.data.data),
  });

  // Query expenses to compute count per category
  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expenseService.list().then((r) => r.data.data),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), expensesQuery.refetch()]);
    setRefreshing(false);
  }, [refetch, expensesQuery]);

  const addCategory = useMutation({
    mutationFn: () => categoryService.create({ name: newName.trim(), color: selectedColor, icon: "cube-outline" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
      setModalVisible(false);
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

  if (isLoading || expensesQuery.isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load categories" onRetry={refetch} />;

  const allCategories = data ?? [];
  const allExpenses = expensesQuery.data?.items ?? [];

  // Compute expense counts per category
  const expenseCounts: Record<string, number> = {};
  allExpenses.forEach(exp => {
    expenseCounts[exp.category] = (expenseCounts[exp.category] || 0) + 1;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* TopAppBar */}
      <View style={[styles.topAppBar, { backgroundColor: colors.surface + "E6", borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="wallet-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Smart Expense</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>EDIT</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={allCategories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item: cat }) => {
            const count = expenseCounts[cat.name] || 0;
            return (
              <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: cat.color + "33" }]}>
                    <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                  </View>
                  {!cat.isDefault && (
                    <TouchableOpacity onPress={() => confirmDelete(cat.id, cat.name)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>{cat.name}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.surfaceVariant, borderColor: "rgba(255,255,255,0.05)" }]}>
                    <Ionicons name="receipt-outline" size={12} color={colors.textSecondary} />
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{count}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <TouchableOpacity 
          style={[styles.createBtn, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "4D" }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.createBtnText, { color: colors.primary }]}>Create New Category</Text>
        </TouchableOpacity>
      </View>

      {/* Add Category Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              placeholder="Category name..."
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              returnKeyType="done"
            />

            <Text style={[styles.colorTitle, { color: colors.text }]}>Select Color</Text>
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

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: newName.trim() ? 1 : 0.5 }]}
              onPress={() => newName.trim() && addCategory.mutate()}
              disabled={!newName.trim() || addCategory.isPending}
            >
              <Text style={[styles.submitBtnText, { color: "#000" }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    zIndex: 50,
  },
  appBarBtn: { padding: 8, borderRadius: 20 },
  appBarTitle: { fontSize: 22, fontWeight: "700" },

  content: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "600", fontFamily: "Hanken Grotesk" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText: { fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: "600", letterSpacing: 0.5 },

  gridContainer: { paddingBottom: spacing.lg },
  columnWrapper: { justifyContent: "space-between", marginBottom: spacing.sm },
  card: {
    width: CARD_WIDTH,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { gap: 8 },
  catName: { fontSize: 16, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    marginTop: spacing.md,
  },
  createBtnText: { fontSize: 18, fontWeight: "600", fontFamily: "Hanken Grotesk" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.md, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: spacing.md },
  colorTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: spacing.lg },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  submitBtn: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
});
