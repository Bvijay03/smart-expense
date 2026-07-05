import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { expenseService, groupService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { EXPENSE_CATEGORIES } from "@/shared/utils/constants";
import { RootStackParamList } from "@/shared/navigation/types";
import { getErrorMessage } from "@/shared/services/api";

export function ExpensesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [moveExpenseId, setMoveExpenseId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expenseService.list().then((r) => r.data.data),
  });

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupService.list().then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const moveMutation = useMutation({
    mutationFn: ({ expenseId, groupId }: { expenseId: string; groupId: string }) =>
      expenseService.moveToGroup(expenseId, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setMoveExpenseId(null);
      Alert.alert("Success", "Expense moved to group!");
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDelete = (id: string) => {
    Alert.alert("Delete expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const allItems = data?.items ?? [];

  const showActions = (expense: { id: string; category: string; amount: number }) => {
    Alert.alert(
      `${expense.category} · ₹${expense.amount.toFixed(2)}`,
      "Choose an action",
      [
        { text: "Edit", onPress: () => {
          const item = allItems.find((i) => i.id === expense.id);
          if (item) {
            navigation.navigate("EditExpense", {
              expenseId: item.id,
              amount: item.amount,
              category: item.category,
              expenseDate: item.expenseDate,
              notes: item.notes,
            });
          }
        }},
        { text: "Move to Group", onPress: () => setMoveExpenseId(expense.id) },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(expense.id) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch =
        !search ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        (item.notes ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allItems, search, activeCategory]);

  const totalFiltered = filtered.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load expenses" onRetry={refetch} />;

  const groups = groupsQuery.data ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Expenses" subtitle="Track personal spending" />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddExpense")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>



      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by category or notes..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: !activeCategory ? colors.primary : colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={{ color: !activeCategory ? "#fff" : colors.text, fontSize: 12 }}>All</Text>
        </TouchableOpacity>
        {EXPENSE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, { backgroundColor: activeCategory === cat ? colors.primary : colors.surface, borderColor: colors.border }]}
            onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
          >
            <Text style={{ color: activeCategory === cat ? "#fff" : colors.text, fontSize: 12 }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Total display */}
      {filtered.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
          </Text>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>
            Total: ₹{totalFiltered.toFixed(2)}
          </Text>
        </View>
      )}

      {filtered.length === 0 ? (
        allItems.length === 0 ? (
          <EmptyState title="No expenses yet" message="Tap + to add your first expense" icon="receipt-outline" />
        ) : (
          <EmptyState title="No results" message="Try a different search or filter" icon="search-outline" />
        )
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <TouchableOpacity style={styles.row} onLongPress={() => showActions(item)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.category, { color: colors.text }]}>{item.category}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {new Date(item.expenseDate).toLocaleDateString()}
                  </Text>
                  {item.notes ? (
                    <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{item.notes}</Text>
                  ) : null}
                </View>
                <Text style={[styles.amount, { color: colors.primary }]}>₹{item.amount.toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("EditExpense", {
                    expenseId: item.id,
                    amount: item.amount,
                    category: item.category,
                    expenseDate: item.expenseDate,
                    notes: item.notes,
                  })}
                  style={{ marginRight: 4 }}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showActions(item)}>
                  <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}

      {/* Move to Group Modal */}
      <Modal visible={!!moveExpenseId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Move to Group</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
              Select a group to share this expense with all members (equal split).
            </Text>
            {groups.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.md }}>
                No groups found. Create a group first.
              </Text>
            ) : (
              groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groupOption, { borderColor: colors.border }]}
                  onPress={() => moveExpenseId && moveMutation.mutate({ expenseId: moveExpenseId, groupId: g.id })}
                >
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <Text style={[styles.groupName, { color: colors.text }]}>{g.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setMoveExpenseId(null)}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  fab: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  topActions: { flexDirection: "row", justifyContent: "flex-end", marginBottom: spacing.sm },
  exportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  exportText: { fontSize: 13, fontWeight: "600" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14 },
  chipScroll: { flexGrow: 0, marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", gap: 6, paddingRight: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  totalAmount: { fontWeight: "700", fontSize: 14 },
  list: { paddingBottom: spacing.xl },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  category: { fontSize: 16, fontWeight: "600" },
  amount: { fontSize: 16, fontWeight: "700" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.md, paddingBottom: spacing.xl },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  groupOption: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  groupName: { flex: 1, fontSize: 15, fontWeight: "600" },
  cancelBtn: {
    alignItems: "center", paddingVertical: 14,
    marginTop: spacing.sm, borderRadius: 12, borderWidth: 1,
  },
});
