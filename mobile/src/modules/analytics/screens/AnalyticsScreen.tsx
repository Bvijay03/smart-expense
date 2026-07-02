import { useQuery } from "@tanstack/react-query";
import { Dimensions, ScrollView, StyleSheet, Text, View, Alert, TouchableOpacity } from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { analyticsService } from "@/shared/services/modules";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getErrorMessage } from "@/shared/services/api";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";

const chartWidth = Dimensions.get("window").width - spacing.md * 2;

const CHART_COLORS = [
  "#4F46E5",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SummaryCard({ icon, iconColor, label, value, subValue, bgColor, colors }: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  subValue?: string;
  bgColor: string;
  colors: any;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.summaryIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
      {subValue ? (
        <Text style={[styles.summarySubValue, { color: colors.textSecondary }]} numberOfLines={1}>{subValue}</Text>
      ) : null}
    </View>
  );
}

export function AnalyticsScreen() {
  const { colors } = useTheme();

  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => analyticsService.summary().then((r) => r.data.data),
  });

  const byCategory = useQuery({
    queryKey: ["analytics", "by-category"],
    queryFn: () => analyticsService.byCategory().then((r) => r.data.data),
  });

  const trends = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: () => analyticsService.trends().then((r) => r.data.data),
  });

  if (summary.isLoading || byCategory.isLoading || trends.isLoading) return <LoadingState />;
  if (summary.isError) {
    return <ErrorState message="Failed to load analytics" onRetry={summary.refetch} />;
  }

  const s = summary.data;
  const changeColor = (s?.monthOverMonthChange ?? 0) > 0 ? colors.error : colors.success;
  const changeIcon = (s?.monthOverMonthChange ?? 0) > 0 ? "trending-up" : "trending-down";
  const changeText = `${(s?.monthOverMonthChange ?? 0) > 0 ? "+" : ""}${s?.monthOverMonthChange ?? 0}% vs last month`;

  const pieData = (byCategory.data ?? []).map((item: { category: string; total: number }, i: number) => ({
    name: item.category,
    amount: item.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const totalCategorySpend = (byCategory.data ?? []).reduce((sum: number, item: { total: number }) => sum + item.total, 0);

  const barData = {
    labels: (trends.data?.months ?? []).map((m: { month: number }) => MONTH_LABELS[m.month - 1]),
    datasets: [
      {
        data: (trends.data?.months ?? []).map((m: { total: number }) => m.total || 0.01),
      },
    ],
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Analytics" subtitle="Spending insights" />

      <View style={{ alignItems: "flex-end", marginBottom: spacing.sm }}>
        <TouchableOpacity
          style={[styles.exportBtn, { borderColor: colors.border }]}
          onPress={async () => {
            try {
              const res = await analyticsService.exportCsv();
              const csv = res.data;
              const fileName = `analytics-${Date.now()}.csv`;
              const fileUri = ((FileSystem as any).documentDirectory ?? "") + fileName;
              await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
              await Sharing.shareAsync(fileUri, { mimeType: "text/csv", dialogTitle: "Export analytics" });
            } catch (err) {
              Alert.alert("Export failed", getErrorMessage(err));
            }
          }}
        >
          <Ionicons name="download-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Summary cards ── */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          icon="cash-outline"
          iconColor="#4F46E5"
          bgColor="#4F46E518"
          label="Total Spent"
          value={`₹${(s?.total ?? 0).toFixed(0)}`}
          subValue={`${s?.transactionCount ?? 0} transactions`}
          colors={colors}
        />
        <SummaryCard
          icon="today-outline"
          iconColor="#22C55E"
          bgColor="#22C55E18"
          label="Avg / Day"
          value={`₹${(s?.averagePerDay ?? 0).toFixed(0)}`}
          colors={colors}
        />
        <SummaryCard
          icon="podium-outline"
          iconColor="#F59E0B"
          bgColor="#F59E0B18"
          label="Top Category"
          value={s?.topCategory?.category ?? "—"}
          subValue={s?.topCategory ? `₹${s.topCategory.total.toFixed(0)}` : undefined}
          colors={colors}
        />
        <SummaryCard
          icon={changeIcon}
          iconColor={changeColor}
          bgColor={changeColor + "18"}
          label="vs Last Month"
          value={changeText}
          subValue={`Prev: ₹${(s?.previousMonthTotal ?? 0).toFixed(0)}`}
          colors={colors}
        />
      </View>

      {/* ── Pie chart ── */}
      {pieData.length > 0 ? (
        <Card>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            By Category
          </Text>
          <PieChart
            data={pieData}
            width={chartWidth - spacing.md * 2}
            height={200}
            chartConfig={{
              color: () => colors.text,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </Card>
      ) : (
        <Card>
          <Text style={{ color: colors.textSecondary }}>No category data yet</Text>
        </Card>
      )}

      {/* ── Category breakdown list ── */}
      {(byCategory.data ?? []).length > 0 && (
        <Card>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Category Breakdown</Text>
          {(byCategory.data ?? []).map((item: { category: string; total: number }, i: number) => {
            const percentage = totalCategorySpend > 0
              ? Math.round((item.total / totalCategorySpend) * 100)
              : 0;
            const barColor = CHART_COLORS[i % CHART_COLORS.length];
            return (
              <View key={item.category} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: barColor }]} />
                <Text style={[styles.catName, { color: colors.text }]}>{item.category}</Text>
                <Text style={[styles.catPercent, { color: colors.textSecondary }]}>{percentage}%</Text>
                <Text style={[styles.catAmount, { color: colors.text }]}>₹{item.total.toFixed(0)}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* ── Bar chart ── */}
      <Card>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Monthly Trend ({trends.data?.year})
        </Text>
        <BarChart
          data={barData}
          width={chartWidth - spacing.md * 2}
          height={220}
          yAxisLabel="₹"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: colors.surface,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => colors.primary,
            labelColor: () => colors.textSecondary,
          }}
          style={styles.chart}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  chart: { borderRadius: 12 },

  // Summary cards
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    width: "48%",
    flexGrow: 1,
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
  },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  summaryLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: "700" },
  summarySubValue: { fontSize: 11, marginTop: 2 },

  // Category breakdown
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 14, fontWeight: "600" },
  catPercent: { fontSize: 13, width: 36, textAlign: "right" },
  catAmount: { fontSize: 14, fontWeight: "700", width: 70, textAlign: "right" },
  exportBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
