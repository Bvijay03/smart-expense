import { decimalToNumber } from "@/utils/helpers";
import { expensesRepository } from "@/modules/expenses/expenses.repository";
import { analyticsQuerySchema } from "./analytics.schema";

function getMonthDateRange(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return { startDate, endDate };
}

function getDefaultDateRange() {
  const now = new Date();
  return getMonthDateRange(now.getMonth() + 1, now.getFullYear());
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export const analyticsService = {
  async summary(userId: string, query: unknown) {
    const parsed = analyticsQuerySchema.parse(query);
    const { startDate, endDate } =
      parsed.startDate && parsed.endDate
        ? { startDate: parsed.startDate, endDate: parsed.endDate }
        : getDefaultDateRange();

    const [agg, count, topCat] = await Promise.all([
      expensesRepository.sumForPeriod(userId, startDate, endDate),
      expensesRepository.countForPeriod(userId, startDate, endDate),
      expensesRepository.topCategoryForPeriod(userId, startDate, endDate),
    ]);

    const total = decimalToNumber(agg._sum.amount ?? 0);
    const days = daysBetween(startDate, endDate);
    const averagePerDay = total > 0 ? Math.round((total / days) * 100) / 100 : 0;

    // Previous month comparison
    const prevMonth = startDate.getMonth() === 0 ? 12 : startDate.getMonth();
    const prevYear = startDate.getMonth() === 0 ? startDate.getFullYear() - 1 : startDate.getFullYear();
    const prevRange = getMonthDateRange(prevMonth, prevYear);
    const prevAgg = await expensesRepository.sumForPeriod(userId, prevRange.startDate, prevRange.endDate);
    const previousMonthTotal = decimalToNumber(prevAgg._sum.amount ?? 0);
    const monthOverMonthChange = previousMonthTotal > 0
      ? Math.round(((total - previousMonthTotal) / previousMonthTotal) * 100)
      : total > 0 ? 100 : 0;

    const byCategory = await expensesRepository.sumByCategory(userId, startDate, endDate);

    return {
      total,
      transactionCount: count,
      averagePerDay,
      topCategory: topCat ? { category: topCat.category, total: decimalToNumber(topCat.total ?? 0) } : null,
      previousMonthTotal,
      monthOverMonthChange,
      startDate,
      endDate,
      categoryCount: byCategory.length,
    };
  },

  async byCategory(userId: string, query: unknown) {
    const parsed = analyticsQuerySchema.parse(query);
    const { startDate, endDate } =
      parsed.startDate && parsed.endDate
        ? { startDate: parsed.startDate, endDate: parsed.endDate }
        : getDefaultDateRange();

    const byCategory = await expensesRepository.sumByCategory(userId, startDate, endDate);

    return byCategory.map((c: { category: string; _sum: { amount: unknown } }) => ({
      category: c.category,
      total: decimalToNumber(c._sum.amount ?? 0),
    }));
  },

  async trends(userId: string, query: unknown) {
    const parsed = analyticsQuerySchema.parse(query);
    const year = parsed.year ?? new Date().getFullYear();
    const monthly = await expensesRepository.sumByMonth(userId, year);

    const months = Array.from({ length: 12 }, (_, i) => {
      const match = monthly.find((m: { month: number; total: number }) => m.month === i + 1);
      return {
        month: i + 1,
        total: match ? Number(match.total) : 0,
      };
    });

    return { year, months };
  },

  async exportCsv(userId: string, query: unknown) {
    const byCategory = await this.byCategory(userId, query);

    const header = ["category", "total"];
    const rows = byCategory.map((c: { category: string; total: number }) => [
      c.category,
      decimalToNumber(c.total ?? 0),
    ]);

    const escapeCsv = (value: string | number) => {
      const stringValue = String(value ?? "");
      return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
    };

    return [header.join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");
  },
};
