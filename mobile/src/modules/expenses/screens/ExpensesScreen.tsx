import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  SectionList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { expenseService, groupService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { getErrorMessage } from "@/shared/services/api";
import { format, isToday, isYesterday, parseISO } from "date-fns";

export function ExpensesScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [moveExpenseId, setMoveExpenseId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => expenseService.list().then((r) => r.data.data),
  });

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupService.list().then((r) => r.data.data),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), groupsQuery.refetch()]);
    setRefreshing(false);
  }, [refetch, groupsQuery]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
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
        { text: "Add to Group", onPress: () => setMoveExpenseId(expense.id) },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(expense.id) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      return !search ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        (item.notes ?? "").toLowerCase().includes(search.toLowerCase());
    });
  }, [allItems, search]);

  // Group by relative date
  const groupedData = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(item => {
      const d = parseISO(item.expenseDate);
      let label = format(d, "MMM d, yyyy");
      if (isToday(d)) label = "TODAY";
      else if (isYesterday(d)) label = "YESTERDAY";

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return Object.keys(groups).map(key => ({
      title: key,
      data: groups[key].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    }));
  }, [filtered]);

  const totalFiltered = filtered.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load expenses" onRetry={refetch} />;

  const groups = groupsQuery.data ?? [];

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("din") || c.includes("food") || c.includes("rest")) return { icon: "restaurant", color: colors.primary };
    if (c.includes("trans") || c.includes("travel") || c.includes("cab")) return { icon: "car", color: "#ffb1c4" };
    if (c.includes("entert") || c.includes("movie")) return { icon: "film", color: colors.primary };
    if (c.includes("shop") || c.includes("grocer")) return { icon: "cart", color: colors.success };
    if (c.includes("bill") || c.includes("util")) return { icon: "flash", color: colors.warning };
    return { icon: "receipt", color: colors.primary };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Background Decorative Elements */}
      <View style={[styles.bgBlobTop, { backgroundColor: colors.primary + "1A" }]} />
      
      {/* TopAppBar */}
      <View style={[styles.topAppBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.appBarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appBarTitle, { color: colors.primary }]}>Expenses</Text>
        <TouchableOpacity style={styles.appBarBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.summaryGlow, { backgroundColor: colors.primary + "1A" }]} />
          
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOTAL MONTHLY SPEND</Text>
            <View style={styles.summaryAmountRow}>
              <Text style={[styles.summaryTotal, { color: colors.primary }]}>₹{totalFiltered.toFixed(2).split('.')[0]}</Text>
              <Text style={[styles.summaryCents, { color: colors.textSecondary }]}>.{totalFiltered.toFixed(2).split('.')[1]}</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breakdownScroll}>
            <View style={[styles.breakdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>PERSONAL</Text>
              <Text style={[styles.breakdownVal, { color: colors.text }]}>₹{totalFiltered.toFixed(2)}</Text>
            </View>
            <View style={[styles.breakdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>GROUP</Text>
              <Text style={[styles.breakdownVal, { color: colors.text }]}>₹0.00</Text>
            </View>
            <View style={[styles.breakdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>FRIENDS</Text>
              <Text style={[styles.breakdownVal, { color: colors.text }]}>₹0.00</Text>
            </View>
          </ScrollView>
        </View>

        {/* Search & Filter Controls */}
        <View style={styles.controlsRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textSecondary + "80"}
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="filter-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Transaction List */}
        <Text style={[styles.listTitle, { color: colors.text }]}>Recent Transactions</Text>
        
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary + "50"} />
            <Text style={{ color: colors.textSecondary, marginTop: 12, fontFamily: "Hanken Grotesk" }}>No transactions found</Text>
          </View>
        ) : (
          <SectionList
            sections={groupedData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sectionListContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
            )}
            renderItem={({ item }) => {
              const { icon, color } = getCategoryIcon(item.category);
              const dateStr = format(parseISO(item.expenseDate), "hh:mm a");
              
              return (
                <TouchableOpacity 
                  style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onLongPress={() => showActions(item)}
                  onPress={() => navigation.navigate("EditExpense", {
                    expenseId: item.id,
                    amount: item.amount,
                    category: item.category,
                    expenseDate: item.expenseDate,
                    notes: item.notes,
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconContainer, { backgroundColor: color + "1A", borderColor: color + "33" }]}>
                      <Ionicons name={icon as any} size={22} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.notes || `${item.category} Expense`}
                      </Text>
                      <View style={styles.txMetaRow}>
                        <View style={[styles.txTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Text style={[styles.txTagText, { color: colors.textSecondary }]}>{item.category}</Text>
                        </View>
                        <Text style={[styles.txTime, { color: colors.textSecondary }]}>• {dateStr}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: colors.text }]}>-₹{item.amount.toFixed(2)}</Text>
                    <View style={styles.txContextRow}>
                      <Ionicons name="person" size={10} color={colors.primary} />
                      <Text style={[styles.txContextText, { color: colors.primary }]}>Personal</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => navigation.navigate("AddExpense")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Move to Group Modal */}
      <Modal visible={!!moveExpenseId} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMoveExpenseId(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: "100%", alignItems: "center" }}>
            <View style={[styles.modalContent, { backgroundColor: "#1e2024", borderColor: "rgba(255,255,255,0.15)" }]}>
              
              <View style={styles.modalHeader}>
                <View style={[styles.modalIcon, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "4D" }]}>
                  <Ionicons name="share-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Group</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Select a group to convert this personal expense into a shared split.
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 300, width: "100%" }} showsVerticalScrollIndicator={false}>
                {groups.length === 0 ? (
                  <Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.md, fontFamily: "Hanken Grotesk" }}>
                    No groups found. Create a group first.
                  </Text>
                ) : (
                  groups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.groupOption, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        if (moveExpenseId) {
                          const expense = allItems.find(e => e.id === moveExpenseId);
                          if (expense) {
                            setMoveExpenseId(null);
                            navigation.navigate("AddSharedExpense", {
                              groupId: g.id,
                              members: g.members?.map((m: any) => ({ id: m.user.id, name: m.user.name })) ?? [],
                              prefill: {
                                amount: expense.amount.toString(),
                                category: expense.category,
                                description: expense.notes || `${expense.category} expense`,
                                expenseDate: expense.expenseDate.split('T')[0],
                              }
                            });
                          }
                        }
                      }}
                    >
                      <View style={[styles.groupOptionIcon, { backgroundColor: colors.primary + "1A" }]}>
                        <Ionicons name="people" size={18} color={colors.primary} />
                      </View>
                      <Text style={[styles.groupName, { color: colors.text }]}>{g.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: "rgba(255,255,255,0.2)" }]}
                onPress={() => setMoveExpenseId(null)}
              >
                <Text style={{ color: colors.text, fontFamily: "Hanken Grotesk", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative" },
  bgBlobTop: { position: "absolute", top: -100, right: -50, width: 250, height: 250, borderRadius: 125, filter: "blur(60px)", opacity: 0.6 },
  
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
  appBarTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "700" },

  content: { flex: 1, padding: spacing.md },

  // Summary Card
  summaryCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.md,
    shadowColor: "#000", shadowOffset: { width:0, height:8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5
  },
  summaryGlow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.5,
  },
  summaryTop: { marginBottom: spacing.md },
  summaryLabel: { fontSize: 11, fontFamily: "JetBrains Mono", letterSpacing: 1, marginBottom: 4 },
  summaryAmountRow: { flexDirection: "row", alignItems: "baseline" },
  summaryTotal: { fontSize: 40, fontFamily: "Hanken Grotesk", fontWeight: "700", textShadowColor: "rgba(0,245,255,0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  summaryCents: { fontSize: 20, fontFamily: "JetBrains Mono" },
  
  breakdownScroll: { flexDirection: "row", overflow: "visible" },
  breakdownBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 100,
  },
  breakdownLabel: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 0.5, marginBottom: 2 },
  breakdownVal: { fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "700" },

  // Controls
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Hanken Grotesk", height: "100%" },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
  },

  // List
  listTitle: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "700", marginBottom: spacing.sm },
  sectionListContent: { paddingBottom: 120 }, // clear bottom tabs
  sectionHeader: {
    fontSize: 11,
    fontFamily: "JetBrains Mono",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  txLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 8 },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "600", marginBottom: 4 },
  txMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  txTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  txTagText: { fontSize: 9, fontFamily: "JetBrains Mono" },
  txTime: { fontSize: 11, fontFamily: "JetBrains Mono" },
  
  txRight: { alignItems: "flex-end", flexShrink: 0 },
  txAmount: { fontSize: 16, fontFamily: "JetBrains Mono", fontWeight: "700" },
  txContextRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  txContextText: { fontSize: 10, fontFamily: "JetBrains Mono", letterSpacing: 0.5 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 90, // Above bottom tabs
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // Modal
  modalOverlay: { 
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)", 
    justifyContent: "center", alignItems: "center", padding: spacing.md 
  },
  modalContent: { 
    width: "100%", maxWidth: 360, 
    borderRadius: 24, borderWidth: 1, padding: spacing.xl,
    shadowColor: "#000", shadowOffset: { width:0, height:20 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 20
  },
  modalHeader: { alignItems: "center", marginBottom: spacing.lg },
  modalIcon: {
    width: 64, height: 64, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 22, fontFamily: "Hanken Grotesk", fontWeight: "700", marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontFamily: "Hanken Grotesk", textAlign: "center", lineHeight: 18, opacity: 0.8 },
  
  groupOption: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  groupOptionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  groupName: { flex: 1, fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "600" },
  
  cancelBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 14, marginTop: spacing.md, borderRadius: 12, borderWidth: 1,
  },
});
