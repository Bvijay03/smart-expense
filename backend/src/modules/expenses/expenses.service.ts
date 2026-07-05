import { AppError } from "@/utils/app-error";
import { decimalToNumber } from "@/utils/helpers";
import { budgetsService } from "@/modules/budgets/budgets.service";
import { notificationsService } from "@/modules/notifications/notifications.service";
import { groupsService } from "@/modules/groups/groups.service";
import { sharedExpensesService } from "@/modules/shared-expenses/shared-expenses.service";
import { expensesRepository } from "./expenses.repository";
import {
  CreateExpenseInput,
  ExpenseQueryInput,
  UpdateExpenseInput,
  MoveToGroupInput,
} from "./expenses.schema";

function formatExpense(expense: {
  id: string;
  userId: string;
  amount: { toString(): string };
  category: string;
  expenseDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: expense.id,
    userId: expense.userId,
    amount: decimalToNumber(expense.amount),
    category: expense.category,
    expenseDate: expense.expenseDate,
    notes: expense.notes,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

async function checkBudgetAlerts(userId: string, expenseDate: Date) {
  try {
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();
    const budgets = await budgetsService.list(userId, month, year);

    for (const budget of budgets) {
      const percent = budget.percentUsed;

      if (percent >= 100 && percent < 110) {
        await notificationsService.create({
          userId,
          type: "BUDGET_THRESHOLD",
          title: "Budget exceeded!",
          body: `You've exceeded your ${budget.category} budget of ₹${budget.amount.toFixed(2)}. Spent: ₹${budget.spent.toFixed(2)} (${percent}%)`,
          metadata: { budgetId: budget.id, category: budget.category, percentUsed: percent },
        });
      } else if (percent >= 80 && percent < 90) {
        await notificationsService.create({
          userId,
          type: "BUDGET_THRESHOLD",
          title: "Budget warning",
          body: `You've used ${percent}% of your ${budget.category} budget (₹${budget.spent.toFixed(2)} of ₹${budget.amount.toFixed(2)})`,
          metadata: { budgetId: budget.id, category: budget.category, percentUsed: percent },
        });
      }
    }
  } catch {
    // Budget check is non-critical — don't fail the expense operation
  }
}

export const expensesService = {
  async create(userId: string, input: CreateExpenseInput) {
    const expense = await expensesRepository.create({ userId, ...input });
    checkBudgetAlerts(userId, input.expenseDate);
    return formatExpense(expense);
  },

  async list(userId: string, query: ExpenseQueryInput) {
    const [items, total] = await expensesRepository.findMany(userId, query);
    return {
      items: items.map(formatExpense),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(userId: string, id: string) {
    const expense = await expensesRepository.findById(id, userId);
    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense not found");
    return formatExpense(expense);
  },

  async update(userId: string, id: string, input: UpdateExpenseInput) {
    const existing = await expensesRepository.findById(id, userId);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Expense not found");
    const updated = await expensesRepository.update(id, input);
    checkBudgetAlerts(userId, updated.expenseDate);
    return formatExpense(updated);
  },

  async delete(userId: string, id: string) {
    const existing = await expensesRepository.findById(id, userId);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Expense not found");
    await expensesRepository.softDelete(id);
  },

  async moveToGroup(userId: string, expenseId: string, input: MoveToGroupInput) {
    const expense = await expensesRepository.findById(expenseId, userId);
    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense not found");

    // Ensure user is a member of the target group
    await groupsService.ensureMember(input.groupId, userId);

    // Get group members for equal split
    const group = await groupsService.getById(userId, input.groupId);
    const members = (group as any).members ?? [];
    if (members.length === 0) {
      throw new AppError(400, "NO_MEMBERS", "Group has no members");
    }

    const amount = decimalToNumber(expense.amount);
    const description = input.description || expense.notes || `${expense.category} expense`;

    // Create shared expense with equal split
    const sharedExpense = await sharedExpensesService.create(userId, input.groupId, {
      paidById: userId,
      description,
      amount,
      category: expense.category,
      expenseDate: expense.expenseDate,
      splitType: "EQUAL",
      splits: members.map((m: { userId: string }) => ({ userId: m.userId, value: 1 })),
    });

    // Soft-delete the original personal expense
    await expensesRepository.softDelete(expenseId);

    return sharedExpense;
  },

  async exportCsv(userId: string): Promise<string> {
    const rows = await expensesRepository.findAllForExport(userId);
    const header = "id,amount,category,expenseDate,notes,createdAt";
    const lines = rows.map((r) =>
      [
        r.id,
        decimalToNumber(r.amount as any).toFixed(2),
        r.category,
        r.expenseDate.toISOString(),
        `"${(r.notes ?? "").replace(/"/g, '""')}"`,
        r.createdAt.toISOString(),
      ].join(",")
    );
    return [header, ...lines].join("\n");
  },
};
