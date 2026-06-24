import { decimalToNumber } from "@/utils/helpers";
import { expensesRepository } from "@/modules/expenses/expenses.repository";
import { analyticsQuerySchema } from "./analytics.schema";

function getDefaultDateRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate, endDate };
}

export const analyticsService = {
  async summary(userId: string, query: unknown) {
    const parsed = analyticsQuerySchema.parse(query);
    const { startDate, endDate } =
      parsed.startDate && parsed.endDate
        ? { startDate: parsed.startDate, endDate: parsed.endDate }
        : getDefaultDateRange();

    const agg = await expensesRepository.sumForPeriod(
      userId,
      startDate,
      endDate,
    );
    const total = decimalToNumber(agg._sum.amount ?? 0);

    const byCategory = await expensesRepository.sumByCategory(
      userId,
      startDate,
      endDate,
    );

    return {
      total,
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

    const byCategory = await expensesRepository.sumByCategory(
      userId,
      startDate,
      endDate,
    );

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
};
