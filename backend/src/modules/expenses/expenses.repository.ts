import { prisma } from "@/database/prisma";
import { ExpenseQueryInput } from "./expenses.schema";

export const expensesRepository = {
  create(data: {
    userId: string;
    amount: number;
    category: string;
    expenseDate: Date;
    notes?: string;
  }) {
    return prisma.expense.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        category: data.category,
        expenseDate: data.expenseDate,
        notes: data.notes,
      },
    });
  },

  findById(id: string, userId: string) {
    return prisma.expense.findFirst({
      where: { id, userId, deletedAt: null },
    });
  },

  findMany(userId: string, query: ExpenseQueryInput) {
    const { page, limit, category, startDate, endDate } = query;
    const where = {
      userId,
      deletedAt: null,
      ...(category && { category }),
      ...(startDate || endDate
        ? {
            expenseDate: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    return prisma.$transaction([
      prisma.expense.findMany({
        where,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);
  },

  update(
    id: string,
    data: Partial<{
      amount: number;
      category: string;
      expenseDate: Date;
      notes: string | null;
    }>,
  ) {
    return prisma.expense.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  sumByCategory(userId: string, startDate: Date, endDate: Date) {
    return prisma.expense.groupBy({
      by: ["category"],
      where: {
        userId,
        deletedAt: null,
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
  },

  sumByMonth(userId: string, year: number) {
    return prisma.$queryRaw<{ month: number; total: number }[]>`
      SELECT EXTRACT(MONTH FROM expense_date)::int as month, SUM(amount)::float as total
      FROM expenses
      WHERE user_id = ${userId}
        AND deleted_at IS NULL
        AND EXTRACT(YEAR FROM expense_date) = ${year}
      GROUP BY EXTRACT(MONTH FROM expense_date)
      ORDER BY month
    `;
  },

  sumForPeriod(userId: string, startDate: Date, endDate: Date) {
    return prisma.expense.aggregate({
      where: {
        userId,
        deletedAt: null,
        expenseDate: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
  },
};
