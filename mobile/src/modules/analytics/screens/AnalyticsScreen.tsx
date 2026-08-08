import { useQuery } from "@tanstack/react-query";
import { Dimensions, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { analyticsService } from "@/shared/services/modules";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";

const { width } = Dimensions.get("window");
const chartWidth = width - spacing.md * 2;

const CHART_COLORS = [
  "#00f5ff", // primary-container
  "#2ff801", // secondary-container
  "#ffd2dc", // tertiary-container
  "#849495", // outline
];

export function AnalyticsScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<any>();

  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsService.summary().then((r) => r.data.data),
  });

  const byCategory = useQuery({
    queryKey: ["analytics", "by-category"],
    queryFn: () => analyticsService.byCategory().then((r) => r.data.data),
  });

  if (summary.isLoading || byCategory.isLoading) return <LoadingState />;
  if (summary.isError) {
    return <ErrorState message="Failed to load analytics" onRetry={summary.refetch} />;
  }

  const s = summary.data;
  
  // Format category data for PieChart
  const totalCategorySpend = (byCategory.data ?? []).reduce((sum: number, item: { total: number }) => sum + item.total, 0);
  
  // Take top 3 + others
  let pieData = [];
  const sortedCategories = [...(byCategory.data ?? [])].sort((a, b) => b.total - a.total);
  if (sortedCategories.length <= 4) {
    pieData = sortedCategories.map((item, i) => ({
      name: item.category,
      amount: item.total,
      color: CHART_COLORS[i % CHART_COLORS.length],
      legendFontColor: colors.textSecondary,
      legendFontSize: 12,
    }));
  } else {
    const top3 = sortedCategories.slice(0, 3);
    const others = sortedCategories.slice(3).reduce((sum, item) => sum + item.total, 0);
    pieData = [
      ...top3.map((item, i) => ({
        name: item.category,
        amount: item.total,
        color: CHART_COLORS[i],
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      })),
      {
        name: "Others",
        amount: others,
        color: CHART_COLORS[3],
        legendFontColor: colors.textSecondary,
        legendFontSize: 12,
      }
    ];
  }

  // Budget Mock Data (since we don't have budget endpoints yet)
  const budgets = [
    { name: "Food", spent: 450, limit: 500, icon: "restaurant", color: colors.warning }, // near limit
    { name: "Transport", spent: 150, limit: 300, icon: "car", color: colors.primary }, // fine
    { name: "Housing", spent: 1200, limit: 1500, icon: "home", color: colors.success }, // fine
  ];

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
        <Text style={[styles.mainTitle, { color: colors.primary }]}>Analytics Overview</Text>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          
          {/* Spending Trend Card */}
          <View style={[styles.glassCard, styles.trendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Spending Trend</Text>
              <Ionicons name="trending-up" size={20} color={colors.textSecondary} />
            </View>

            <View style={styles.trendChart}>
              {/* Grid Lines */}
              <View style={styles.gridLines}>
                <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
                <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
                <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
              </View>
              
              <View style={styles.barsContainer}>
                {/* Last Month Bar */}
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: '60%', backgroundColor: colors.surfaceVariant }]}>
                    <Text style={[styles.barLabel, { color: colors.text }]}>
                      ₹{(s?.previousMonthTotal ?? 0).toFixed(0)}
                    </Text>
                  </View>
                  <Text style={[styles.barFooter, { color: colors.textSecondary }]}>Last</Text>
                </View>
                
                {/* This Month Bar */}
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: '85%', backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: {width:0, height:0}, elevation: 8 }]}>
                    <Text style={[styles.barLabel, { color: colors.primary }]}>
                      ₹{(s?.total ?? 0).toFixed(0)}
                    </Text>
                  </View>
                  <Text style={[styles.barFooter, { color: colors.primary, fontWeight: '700' }]}>This</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Category Breakdown Card */}
          <View style={[styles.glassCard, styles.pieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Category Breakdown</Text>
              <Ionicons name="pie-chart-outline" size={20} color={colors.textSecondary} />
            </View>

            {pieData.length > 0 ? (
              <View style={styles.pieContainer}>
                <PieChart
                  data={pieData}
                  width={chartWidth}
                  height={160}
                  chartConfig={{ color: () => colors.text }}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="40"
                  hasLegend={false}
                  absolute
                />
                {/* Donut Hole overlay */}
                <View style={[styles.donutHole, { backgroundColor: colors.background }]} />
                <View style={styles.donutText}>
                  <Text style={[styles.donutTotalLabel, { color: colors.text }]}>Total</Text>
                  <Text style={[styles.donutTotalValue, { color: colors.primary }]}>₹{(s?.total ?? 0).toFixed(0)}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.pieContainer, { justifyContent: 'center' }]}>
                <Text style={{ color: colors.textSecondary }}>No data</Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legendContainer}>
              {pieData.map((d: any) => {
                const perc = totalCategorySpend > 0 ? Math.round((d.amount / totalCategorySpend) * 100) : 0;
                return (
                  <View key={d.name} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color, shadowColor: d.color, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: {width:0, height:0} }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>{d.name} {perc}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Budget Management */}
        <View style={[styles.glassCard, { marginTop: spacing.md, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.budgetHeader}>
            <Text style={[styles.budgetTitle, { color: colors.text }]}>Budget Management</Text>
            <TouchableOpacity 
              style={[styles.budgetAddBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => navigation.navigate("Budgets")}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.budgetList}>
            {budgets.map(b => {
              const perc = Math.min(100, Math.round((b.spent / b.limit) * 100));
              return (
                <View key={b.name} style={[styles.budgetItem, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={styles.budgetItemTop}>
                    <View style={styles.budgetItemLeft}>
                      <View style={[styles.budgetIconBox, { backgroundColor: b.color + "33" }]}>
                        <Ionicons name={b.icon as any} size={18} color={b.color} />
                      </View>
                      <Text style={[styles.budgetName, { color: colors.text }]}>{b.name}</Text>
                    </View>
                    <View style={styles.budgetItemRight}>
                      <Text style={[styles.budgetAmounts, { color: perc >= 90 ? colors.error : colors.textSecondary }]}>
                        ₹{b.spent} / ₹{b.limit}
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate("Budgets")}>
                        <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                    <View style={[
                      styles.progressBarFill, 
                      { width: `${perc}%`, backgroundColor: perc >= 90 ? colors.error : b.color },
                      perc < 90 && { shadowColor: b.color, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: {width:0, height:0}, elevation: 4 }
                    ]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
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
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },
  
  mainTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Hanken Grotesk", marginBottom: spacing.md, textShadowColor: "rgba(0,245,255,0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  bentoGrid: { gap: spacing.md },
  
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  
  // Trend
  trendCard: { paddingBottom: spacing.sm },
  trendChart: { height: 160, position: "relative", marginTop: spacing.md },
  gridLines: { position: "absolute", inset: 0, justifyContent: "space-between", paddingVertical: 20 },
  gridLine: { width: "100%", height: 1, opacity: 0.1 },
  barsContainer: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end" },
  barWrapper: { width: "30%", alignItems: "center", height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderTopLeftRadius: 4, borderTopRightRadius: 4, position: "relative" },
  barLabel: { position: "absolute", top: -24, width: "100%", textAlign: "center", fontSize: 12, fontFamily: "JetBrains Mono" },
  barFooter: { fontSize: 12, fontFamily: "JetBrains Mono", marginTop: 8 },

  // Pie
  pieCard: { alignItems: "center" },
  pieContainer: { height: 180, width: "100%", alignItems: "center", justifyContent: "center", position: "relative" },
  donutHole: { position: "absolute", width: 100, height: 100, borderRadius: 50, zIndex: 10 },
  donutText: { position: "absolute", zIndex: 11, alignItems: "center", justifyContent: "center" },
  donutTotalLabel: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  donutTotalValue: { fontSize: 24, fontWeight: "700", fontFamily: "Hanken Grotesk", textShadowColor: "rgba(0,245,255,0.3)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  legendContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: spacing.md, width: "100%" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "45%" },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  // Budgets
  budgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  budgetTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Hanken Grotesk" },
  budgetAddBtn: { padding: 6, borderRadius: 20 },
  budgetList: { gap: 12 },
  budgetItem: { padding: 12, borderRadius: 12 },
  budgetItemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  budgetItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  budgetIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  budgetName: { fontSize: 16, fontFamily: "Hanken Grotesk" },
  budgetItemRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  budgetAmounts: { fontSize: 12, fontFamily: "JetBrains Mono" },
  progressBarBg: { width: "100%", height: 8, borderRadius: 4, overflow: "visible" },
  progressBarFill: { height: "100%", borderRadius: 4 },
});
