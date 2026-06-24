import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { sharedExpenseService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "SharedExpenseDetail">;

export function SharedExpenseDetailScreen({ route }: Props) {
  const { expenseId, groupId } = route.params;
  const { colors } = useTheme();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["shared-expense", expenseId],
    queryFn: () => sharedExpenseService.list(groupId).then((r) => {
      const expense = r.data.data.find((e) => e.id === expenseId);
      if (!expense) throw new Error("Expense not found");
      return expense;
    }),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data) return <ErrorState message="Failed to load expense" onRetry={refetch} />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title={data.description} subtitle={`${data.category} · ${new Date(data.expenseDate).toLocaleDateString()}`} />

      <Card>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Total Amount</Text>
          <Text style={[styles.amount, { color: colors.primary }]}>₹{data.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Paid by</Text>
          <Text style={[styles.value, { color: colors.text }]}>{data.paidBy.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Split type</Text>
          <Text style={[styles.value, { color: colors.text }]}>{data.splitType}</Text>
        </View>
      </Card>

      <Text style={[styles.section, { color: colors.text }]}>Split Breakdown</Text>
      {data.splits.map((split) => (
        <Card key={split.userId}>
          <View style={styles.row}>
            <Text style={[styles.value, { color: colors.text }]}>{split.user.name}</Text>
            <View style={styles.splitRight}>
              <Text style={[styles.amount, { color: colors.primary }]}>
                ₹{split.amountOwed.toFixed(2)}
              </Text>
              <Text style={[styles.percent, { color: colors.textSecondary }]}>
                {((split.amountOwed / data.amount) * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
          {split.user.name === data.paidBy.name && (
            <Text style={[styles.badge, { color: colors.primary }]}>Paid</Text>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  section: { fontSize: 16, fontWeight: "600", marginVertical: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  label: { fontSize: 13 },
  value: { fontSize: 15, fontWeight: "500" },
  amount: { fontSize: 16, fontWeight: "700" },
  splitRight: { alignItems: "flex-end" },
  percent: { fontSize: 12, marginTop: 2 },
  badge: { fontSize: 12, fontWeight: "600", marginTop: 4 },
});
