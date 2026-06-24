import { useQuery } from "@tanstack/react-query";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { PieChart, BarChart } from "react-native-chart-kit";
import { analyticsService } from "@/shared/services/modules";
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

export function AnalyticsScreen() {
  const { colors } = useTheme();

  const byCategory = useQuery({
    queryKey: ["analytics", "by-category"],
    queryFn: () => analyticsService.byCategory().then((r) => r.data.data),
  });

  const trends = useQuery({
    queryKey: ["analytics", "trends"],
    queryFn: () => analyticsService.trends().then((r) => r.data.data),
  });

  if (byCategory.isLoading || trends.isLoading) return <LoadingState />;
  if (byCategory.isError) {
    return <ErrorState message="Failed to load analytics" onRetry={byCategory.refetch} />;
  }

  const pieData = (byCategory.data ?? []).map((item: { category: string; total: number }, i: number) => ({
    name: item.category,
    amount: item.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  const barData = {
    labels: (trends.data?.months ?? []).map((m: { month: number }) => String(m.month)),
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
  content: { padding: spacing.md },
  chartTitle: { fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  chart: { borderRadius: 12 },
});
