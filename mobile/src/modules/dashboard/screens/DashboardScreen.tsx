import { useQuery } from "@tanstack/react-query";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { analyticsService, budgetService, notificationService } from "@/shared/services/modules";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

export function DashboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsService.summary().then((r) => r.data.data),
  });

  const budgets = useQuery({
    queryKey: ["budgets"],
    queryFn: () => budgetService.list().then((r) => r.data.data),
  });

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list().then((r) => r.data.data),
  });

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) {
    return <ErrorState message="Failed to load dashboard" onRetry={summary.refetch} />;
  }

  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;
  const overBudget = budgets.data?.filter((b) => b.isOverBudget).length ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader
        title={`Hello, ${user?.name?.split(" ")[0] ?? "there"}`}
        subtitle="Your finance overview"
      />

      <Card>
        <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
          This Month
        </Text>
        <Text style={[styles.amount, { color: colors.text }]}>
          ₹{summary.data?.total?.toFixed(2) ?? "0.00"}
        </Text>
        <Text style={{ color: colors.textSecondary }}>Total spending</Text>
      </Card>

      <View style={styles.row}>
        <Card style={styles.halfCard}>
          <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{unread}</Text>
          <Text style={{ color: colors.textSecondary }}>Unread</Text>
        </Card>
        <Card style={styles.halfCard}>
          <Ionicons name="warning-outline" size={24} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>{overBudget}</Text>
          <Text style={{ color: colors.textSecondary }}>Over budget</Text>
        </Card>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      {[
        { label: "Add Expense", icon: "add-circle-outline" as const, screen: "AddExpense" as const },
        { label: "View Budgets", icon: "wallet-outline" as const, screen: "Budgets" as const },
        { label: "Notifications", icon: "mail-outline" as const, screen: "Notifications" as const },
        { label: "Profile", icon: "person-outline" as const, screen: "Profile" as const },
      ].map((action) => (
        <TouchableOpacity
          key={action.label}
          style={[styles.action, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate(action.screen)}
        >
          <Ionicons name={action.icon} size={22} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  cardLabel: { fontSize: 13, marginBottom: 4 },
  amount: { fontSize: 32, fontWeight: "700", marginBottom: 4 },
  row: { flexDirection: "row", gap: spacing.sm },
  halfCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", marginVertical: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginVertical: spacing.md },
  action: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  actionText: { flex: 1, fontSize: 16, fontWeight: "500" },
});
