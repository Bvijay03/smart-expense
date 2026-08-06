import { useQuery } from "@tanstack/react-query";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Image,
} from "react-native";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { GlassCard } from "@/shared/components/GlassCard";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import {
  analyticsService,
  budgetService,
  notificationService,
  friendsService,
  expenseService,
} from "@/shared/services/modules";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing, borderRadius } from "@/shared/theme";
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

  const friends = useQuery({
    queryKey: ["friends"],
    queryFn: () => friendsService.getFriends().then((r) => r.data.data),
  });

  const recentExpenses = useQuery({
    queryKey: ["expenses", { limit: 3 }],
    queryFn: () => expenseService.list({ limit: 3 }).then((r) => r.data.data.items),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      summary.refetch(),
      budgets.refetch(),
      notifications.refetch(),
      friends.refetch(),
      recentExpenses.refetch(),
    ]);
    setRefreshing(false);
  }, [summary, budgets, notifications, friends, recentExpenses]);

  if (summary.isLoading) return <LoadingState />;
  if (summary.isError) {
    return <ErrorState message="Failed to load dashboard" onRetry={summary.refetch} />;
  }

  const unread = notifications.data?.filter((n) => !n.read).length ?? 0;
  const totalBudget = budgets.data?.reduce((sum, b) => sum + b.amount, 0) ?? 0;
  const totalSpent = summary.data?.total ?? 0;
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const trend = summary.data?.monthOverMonthChange ?? 0;
  const isTrendUp = trend >= 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* TopAppBar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="wallet-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.appTitle, { color: colors.primary }]}>Smart Expense</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
          {unread > 0 && (
            <View style={[styles.bellBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.bellBadgeText}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Overview Card */}
      <GlassCard intensity={30} style={styles.overviewCard}>
        <View style={styles.overviewTop}>
          <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>TOTAL SPEND</Text>
          <Text style={[styles.overviewAmount, { color: colors.primary, textShadowColor: colors.primary + '80', textShadowRadius: 10 }]}>
            ${totalSpent.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.overviewBottom, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary, marginBottom: 4 }]}>REMAINING BUDGET</Text>
            <Text style={[styles.remainingAmount, { color: colors.text }]}>${remainingBudget.toFixed(2)}</Text>
          </View>
          <View style={styles.trendBadge}>
            <Ionicons name={isTrendUp ? "trending-up" : "trending-down"} size={16} color={colors.secondary} />
            <Text style={[styles.trendText, { color: colors.secondary }]}>
              {isTrendUp ? "+" : ""}{trend}%
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Budget Breakdown */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Breakdown</Text>
      </View>
      <View style={styles.budgetList}>
        {budgets.data?.length ? (
          budgets.data.slice(0, 3).map((b) => {
              const barColor = (b.percentUsed ?? 0) >= 100 ? colors.error : colors.primary;
              return (
                <GlassCard key={b.id} intensity={20} style={styles.budgetCard}>
                  <View style={[styles.budgetIconWrap, { backgroundColor: colors.primary + '33' }]}>
                    <Ionicons name="pie-chart" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.budgetInfo}>
                    <View style={styles.budgetRow}>
                      <Text style={[styles.budgetName, { color: colors.textSecondary }]}>{b.category}</Text>
                      <Text style={[styles.budgetPercent, { color: colors.text }]}>{Math.round(b.percentUsed ?? 0)}%</Text>
                    </View>
                    <View style={[styles.budgetTrack, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                      <View style={[styles.budgetFill, { width: `${Math.min(b.percentUsed ?? 0, 100)}%`, backgroundColor: barColor, shadowColor: barColor }]} />
                    </View>
                  </View>
                </GlassCard>
              );
            })
          ) : (
          <Text style={{ color: colors.textSecondary }}>No budgets set.</Text>
        )}
      </View>

      {/* Quick Settlements */}
      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Settlements</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settlementsScroll}>
        {friends.data?.map((f) => {
          const owesMe = f.balance > 0;
          const isNeutral = f.balance === 0;
          if (isNeutral) return null;
          return (
            <TouchableOpacity key={f.id} onPress={() => navigation.navigate("Friends")}>
              <GlassCard intensity={25} style={styles.settlementCard}>
                <View style={styles.settlementTop}>
                  <View style={[styles.friendAvatar, { backgroundColor: colors.surface }]}>
                    <Ionicons name="person" size={20} color={colors.textSecondary} />
                  </View>
                  <View>
                    <Text style={[styles.friendName, { color: colors.text }]}>{f.friend.name}</Text>
                    <Text style={[styles.friendOweText, { color: owesMe ? colors.secondary : colors.error }]}>
                      {owesMe ? "Owes you" : "You owe"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.settlementAmount, { color: owesMe ? colors.primary : colors.text }]}>
                  ${Math.abs(f.balance).toFixed(2)}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} style={styles.settlementArrow} />
              </GlassCard>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={() => navigation.navigate("Friends")}>
          <GlassCard intensity={10} style={[styles.settlementCard, styles.newSettlementCard, { borderColor: colors.border }]}>
            <Ionicons name="add-circle" size={32} color={colors.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={[styles.newSettlementText, { color: colors.textSecondary }]}>NEW SETTLEMENT</Text>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>

      {/* Recent Activity */}
      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs", { screen: "Expenses" })}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.activityList}>
        {recentExpenses.data?.length ? (
          recentExpenses.data.map((exp) => (
            <TouchableOpacity key={exp.id} onPress={() => navigation.navigate("EditExpense", { expenseId: exp.id, amount: exp.amount, category: exp.category, expenseDate: exp.expenseDate, notes: exp.notes })}>
              <GlassCard intensity={15} style={styles.activityCard}>
                <View style={styles.activityLeft}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '33' }]}>
                    <Ionicons name="receipt" size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.activityName, { color: colors.text }]}>{exp.notes || exp.category}</Text>
                    <Text style={[styles.activityCategory, { color: colors.textSecondary }]}>{exp.category}</Text>
                  </View>
                </View>
                <View style={styles.activityRight}>
                  <Text style={[styles.activityAmount, { color: colors.text }]}>-${exp.amount.toFixed(2)}</Text>
                  <Text style={[styles.activityDate, { color: colors.textSecondary }]}>
                    {new Date(exp.expenseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: colors.textSecondary, marginBottom: spacing.xl }}>No recent activity.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },

  // TopAppBar
  topAppBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  appTitle: { fontSize: 24, fontWeight: "600", fontFamily: "Hanken Grotesk" },
  iconBtn: { padding: 8, borderRadius: 20 },
  bellBadge: { position: "absolute", top: 4, right: 6, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Overview Card
  overviewCard: { padding: spacing.lg, marginBottom: spacing.md },
  overviewTop: { marginBottom: spacing.lg },
  overviewLabel: { fontSize: 12, fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1 },
  overviewAmount: { fontSize: 48, fontWeight: "700", fontFamily: "Hanken Grotesk", letterSpacing: -1, marginTop: 4 },
  overviewBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, paddingTop: spacing.sm },
  remainingAmount: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  trendBadge: { flexDirection: "row", alignItems: "center", backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  trendText: { fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: "500" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  viewAllText: { fontSize: 12, fontFamily: "JetBrains Mono", fontWeight: "500" },

  // Budget Breakdown
  budgetList: { gap: spacing.sm },
  budgetCard: { flexDirection: "row", alignItems: "center", padding: spacing.sm, gap: spacing.sm, borderRadius: borderRadius.md },
  budgetIconWrap: { padding: 8, borderRadius: 8 },
  budgetInfo: { flex: 1, gap: 6 },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  budgetName: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  budgetPercent: { fontSize: 12, fontFamily: "JetBrains Mono" },
  budgetTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  budgetFill: { height: "100%", borderRadius: 4 },

  // Quick Settlements
  settlementsScroll: { paddingBottom: spacing.sm, gap: spacing.sm },
  settlementCard: { width: 200, padding: spacing.sm, borderRadius: borderRadius.lg, position: "relative" },
  settlementTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  friendName: { fontSize: 16, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  friendOweText: { fontSize: 12, fontFamily: "JetBrains Mono" },
  settlementAmount: { fontSize: 24, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  settlementArrow: { position: "absolute", bottom: spacing.sm, right: spacing.sm },
  newSettlementCard: { justifyContent: "center", alignItems: "center", borderStyle: "dashed", borderWidth: 1 },
  newSettlementText: { fontSize: 12, fontFamily: "JetBrains Mono", letterSpacing: 1 },

  // Recent Activity
  activityList: { gap: spacing.xs, marginBottom: spacing.xl },
  activityCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.sm, borderRadius: borderRadius.md },
  activityLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  activityIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  activityName: { fontSize: 16, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  activityCategory: { fontSize: 12, fontFamily: "JetBrains Mono", textTransform: "uppercase", marginTop: 2 },
  activityRight: { alignItems: "flex-end" },
  activityAmount: { fontSize: 20, fontWeight: "500", fontFamily: "Hanken Grotesk" },
  activityDate: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 2 },
});

