import { useQuery } from "@tanstack/react-query";
import {
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

export function BudgetsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetService.list().then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load budgets" onRetry={refetch} />;

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

      {!data?.length ? (
        <EmptyState title="No budgets set" message="Create a monthly budget" icon="wallet-outline" />
      ) : (
        data.map((budget) => (
          <Card key={budget.id}>
            <Text style={[styles.category, { color: colors.text }]}>
              {budget.category} · {budget.month}/{budget.year}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              Spent ₹{budget.spent?.toFixed(2)} of ₹{budget.amount.toFixed(2)}
            </Text>
            <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(budget.percentUsed ?? 0, 100)}%`,
                    backgroundColor: budget.isOverBudget
                      ? colors.error
                      : colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={{
                color: budget.isOverBudget ? colors.error : colors.success,
                fontWeight: "600",
                marginTop: spacing.xs,
              }}
            >
              {budget.percentUsed}% used
              {budget.isOverBudget ? " · Over budget!" : ""}
            </Text>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  category: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  progressBg: { height: 8, borderRadius: 4, marginTop: spacing.sm, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
});
