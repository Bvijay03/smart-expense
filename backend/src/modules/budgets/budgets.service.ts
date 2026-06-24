import { AppError } from "@/utils/app-error";
import { decimalToNumber } from "@/utils/helpers";
import { expensesRepository } from "@/modules/expenses/expenses.repository";
import { budgetsRepository } from "./budgets.repository";
import { CreateBudgetInput, UpdateBudgetInput } from "./budgets.schema";

function getMonthDateRange(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return { startDate, endDate };
}

function formatBudget(budget: {
  id: string;
  userId: string;
  category: string;
  amount: { toString(): string };
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: budget.id,
    userId: budget.userId,
    category: budget.category,
    amount: decimalToNumber(budget.amount),
    month: budget.month,
    year: budget.year,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

export const budgetsService = {
  async create(userId: string, input: CreateBudgetInput) {
    try {
      const budget = await budgetsRepository.create({ userId, ...input });
      return formatBudget(budget);
    } catch {
      throw new AppError(
        409,
        "BUDGET_EXISTS",
        "Budget already exists for this category and month",
      );
    }
  },

  async list(userId: string, month?: number, year?: number) {
    const budgets = await budgetsRepository.findByUser(userId, month, year);
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const { startDate, endDate } = getMonthDateRange(m, y);

    const results = await Promise.all(
      budgets.map(async (budget) => {
        const formatted = formatBudget(budget);
        let spent = 0;

        if (budget.category === "ALL") {
          const agg = await expensesRepository.sumForPeriod(
            userId,
            startDate,
            endDate,
          );
          spent = decimalToNumber(agg._sum.amount ?? 0);
        } else {
          const byCat = await expensesRepository.sumByCategory(
            userId,
            startDate,
            endDate,
          );
          const match = byCat.find((c: { category: string }) => c.category === budget.category);
          spent = decimalToNumber(match?._sum.amount ?? 0);
        }

        const percentUsed =
          formatted.amount > 0
            ? Math.round((spent / formatted.amount) * 100)
            : 0;

        return {
          ...formatted,
          spent,
          remaining: Math.max(0, formatted.amount - spent),
          percentUsed,
          isOverBudget: spent > formatted.amount,
        };
      }),
    );

    return results;
  },

  async update(userId: string, id: string, input: UpdateBudgetInput) {
    const budget = await budgetsRepository.findById(id, userId);
    if (!budget) throw new AppError(404, "NOT_FOUND", "Budget not found");
    const updated = await budgetsRepository.update(id, input.amount);
    return formatBudget(updated);
  },

  async delete(userId: string, id: string) {
    const budget = await budgetsRepository.findById(id, userId);
    if (!budget) throw new AppError(404, "NOT_FOUND", "Budget not found");
    await budgetsRepository.delete(id);
  },
};
