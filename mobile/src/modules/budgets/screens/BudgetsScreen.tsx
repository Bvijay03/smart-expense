import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { budgetService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";
import { getErrorMessage } from "@/shared/services/api";

function getProgressColor(percent: number, colors: { success: string; primary: string; warning?: string; error: string }) {
  if (percent >= 100) return colors.error;
  if (percent >= 80) return "#F59E0B"; // amber/warning
  if (percent >= 60) return colors.primary;
  return colors.success;
}

export function BudgetsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetService.list().then((r) => r.data.data),
  });

  const deleteBudget = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  const confirmDelete = (id: string, category: string) => {
    Alert.alert("Delete Budget", `Delete "${category}" budget?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteBudget.mutate(id) },
    ]);
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load budgets" onRetry={refetch} />;

  const overBudget = data?.filter((b) => b.isOverBudget) ?? [];
  const nearBudget = data?.filter((b) => !b.isOverBudget && (b.percentUsed ?? 0) >= 80) ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <ScreenHeader title="Budgets" subtitle="Monthly spending limits" />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("AddBudget")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Alert banners ── */}
      {overBudget.length > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: colors.error + "15", borderColor: colors.error + "44" }]}>
          <Ionicons name="warning" size={20} color={colors.error} />
          <Text style={[styles.alertText, { color: colors.error }]}>
            {overBudget.length} budget{overBudget.length > 1 ? "s" : ""} exceeded!{" "}
            {overBudget.map((b) => b.category).join(", ")}
          </Text>
        </View>
      )}
      {nearBudget.length > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B44" }]}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <Text style={[styles.alertText, { color: "#B45309" }]}>
            {nearBudget.length} budget{nearBudget.length > 1 ? "s" : ""} nearing limit:{" "}
            {nearBudget.map((b) => `${b.category} (${b.percentUsed}%)`).join(", ")}
          </Text>
        </View>
      )}

      {!data?.length ? (
        <EmptyState title="No budgets set" message="Create a monthly budget to track spending" icon="wallet-outline" />
      ) : (
        data.map((budget) => {
          const percent = budget.percentUsed ?? 0;
          const barColor = getProgressColor(percent, colors);

          return (
            <Card key={budget.id}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetTitleRow}>
                  <View style={[styles.categoryIcon, { backgroundColor: barColor + "18" }]}>
                    <Ionicons name="wallet-outline" size={18} color={barColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.category, { color: colors.text }]}>
                      {budget.category}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {budget.month}/{budget.year}
                    </Text>
                  </View>
                  {budget.isOverBudget && (
                    <View style={[styles.overBadge, { backgroundColor: colors.error + "18" }]}>
                      <Ionicons name="warning" size={12} color={colors.error} />
                      <Text style={[styles.overBadgeText, { color: colors.error }]}>Over</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => confirmDelete(budget.id, budget.category)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amounts row */}
              <View style={styles.amountsRow}>
                <View>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Spent</Text>
                  <Text style={[styles.amountValue, { color: barColor }]}>
                    ₹{(budget.spent ?? 0).toFixed(0)}
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Budget</Text>
                  <Text style={[styles.amountValue, { color: colors.text }]}>
                    ₹{budget.amount.toFixed(0)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Remaining</Text>
                  <Text style={[styles.amountValue, { color: (budget.remaining ?? 0) > 0 ? colors.success : colors.error }]}>
                    ₹{(budget.remaining ?? 0).toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.percentText, { color: barColor }]}>
                {percent}% used
              </Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },

  // Alert banners
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: "600" },

  // Budget card
  budgetHeader: { marginBottom: spacing.sm },
  budgetTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  category: { fontSize: 16, fontWeight: "700" },
  overBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  overBadgeText: { fontSize: 11, fontWeight: "700" },

  // Amounts
  amountsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  amountLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  amountValue: { fontSize: 16, fontWeight: "700" },

  // Progress
  progressBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  percentText: { fontSize: 12, fontWeight: "600", marginTop: 4, textAlign: "right" },
});
