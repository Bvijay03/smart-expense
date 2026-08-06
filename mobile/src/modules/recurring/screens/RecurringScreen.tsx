import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { recurringService } from "@/shared/services/modules";
import { getErrorMessage } from "@/shared/services/api";

export function RecurringScreen() {
  const { colors } = useThemeStore();
  const queryClient = useQueryClient();
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["recurring"],
    queryFn: () => recurringService.list().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const parsedAmount = Number(amount);
      const parsedDay = Number(dayOfMonth);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid amount");
      }
      if (!dayOfMonth || isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        throw new Error("Day of month must be between 1 and 31");
      }
      return recurringService.create({
        amount: parsedAmount,
        category,
        notes: notes.trim() || undefined,
        dayOfMonth: parsedDay,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setAmount("");
      setCategory("");
      setNotes("");
      setDayOfMonth("");
      setModalVisible(false);
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => recurringService.toggleActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recurringService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const summary = useMemo(() => {
    const items = data ?? [];
    let totalMonthly = 0;
    items.forEach((item: any) => {
      if (item.isActive) {
        totalMonthly += Number(item.amount);
      }
    });
    return {
      active: items.filter((item: any) => item.isActive).length,
      total: items.length,
      totalMonthly,
    };
  }, [data]);

  const getStatusText = (day: number, isActive: boolean) => {
    if (!isActive) return { text: "INACTIVE", color: colors.textSecondary };
    const today = new Date().getDate();
    if (day === today) return { text: "DUE TODAY", color: colors.warning };
    if (day < today) return { text: "PAID", color: colors.success };
    const daysLeft = day - today;
    return { text: `IN ${daysLeft} DAY${daysLeft > 1 ? 'S' : ''}`, color: colors.textSecondary };
  };

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes("rent") || c.includes("home") || c.includes("house")) return { icon: "home", color: colors.primary };
    if (c.includes("gym") || c.includes("fit")) return { icon: "barbell", color: colors.primary };
    if (c.includes("movie") || c.includes("netf") || c.includes("sub") || c.includes("entert")) return { icon: "film", color: colors.primary };
    if (c.includes("soft") || c.includes("cloud") || c.includes("app")) return { icon: "laptop", color: colors.primary };
    return { icon: "receipt", color: colors.primary };
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load recurring expenses" onRetry={refetch} />;

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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Recurring Expenses</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your automated charges.</Text>
        </View>

        {/* Summary Metric */}
        <View style={[styles.summaryCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOTAL MONTHLY</Text>
          <Text style={[styles.summaryAmount, { color: colors.primary }]}>₹{summary.totalMonthly.toFixed(2)}</Text>
          <View style={styles.summaryTrend}>
            <Ionicons name="trending-up" size={14} color={colors.error} />
            <Text style={[styles.trendText, { color: colors.error }]}>+₹0.00 vs last month</Text>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          {(data ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No recurring expenses yet.</Text>
            </View>
          ) : (
            (data ?? []).map((item: any) => {
              const { icon, color } = getCategoryIcon(item.category);
              const status = getStatusText(item.dayOfMonth, item.isActive);
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.itemCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", opacity: item.isActive ? 1 : 0.6 }]}
                  onLongPress={() => {
                    Alert.alert("Manage", "Choose an action", [
                      { text: item.isActive ? "Pause" : "Resume", onPress: () => toggleMutation.mutate(item.id) },
                      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                      { text: "Cancel", style: "cancel" },
                    ]);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View style={[styles.itemIconBox, { backgroundColor: colors.surfaceVariant, borderColor: "rgba(255,255,255,0.05)" }]}>
                      <Ionicons name={icon as any} size={24} color={color} />
                    </View>
                    <View>
                      <Text style={[styles.itemTitleText, { color: colors.text }]} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <Text style={[styles.itemSubtitleText, { color: colors.textSecondary }]}>
                        Monthly • {item.dayOfMonth}{item.dayOfMonth === 1 ? 'st' : item.dayOfMonth === 2 ? 'nd' : item.dayOfMonth === 3 ? 'rd' : 'th'} of month
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={[styles.itemAmount, { color: colors.text }]}>₹{Number(item.amount).toFixed(2)}</Text>
                    <Text style={[styles.itemStatus, { color: status.color }]}>{status.text}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Recurring Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount (e.g. 1500)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              value={category}
              onChangeText={setCategory}
              placeholder="Category (e.g. Rent, Gym, Netflix)"
              placeholderTextColor={colors.textSecondary}
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              value={dayOfMonth}
              onChangeText={setDayOfMonth}
              placeholder="Day of month (1-31)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
            />

            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant, marginBottom: spacing.lg }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: (amount && category && dayOfMonth) ? 1 : 0.5 }]}
              onPress={() => createMutation.mutate()}
              disabled={!amount || !category || !dayOfMonth || createMutation.isPending}
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

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 120 },
  
  header: { marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "600", fontFamily: "Hanken Grotesk", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Hanken Grotesk" },

  summaryCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  summaryLabel: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 1, marginBottom: 8 },
  summaryAmount: { fontSize: 42, fontWeight: "700", fontFamily: "Hanken Grotesk", textShadowColor: "rgba(0,245,255,0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8, marginBottom: 8 },
  summaryTrend: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  listSection: { gap: spacing.sm },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  itemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitleText: { fontSize: 16, fontWeight: "600", fontFamily: "Hanken Grotesk", marginBottom: 4 },
  itemSubtitleText: { fontSize: 12, fontFamily: "JetBrains Mono" },
  itemRight: { alignItems: "flex-end" },
  itemAmount: { fontSize: 18, fontFamily: "JetBrains Mono", fontWeight: "700", marginBottom: 4 },
  itemStatus: { fontSize: 10, fontFamily: "JetBrains Mono", textTransform: "uppercase", fontWeight: "600" },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.md, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, marginBottom: spacing.sm },
  submitBtn: { height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  submitBtnText: { fontSize: 16, fontWeight: "700" },
});
