import { AppError } from "@/utils/app-error";
import { decimalToNumber } from "@/utils/helpers";
import { expensesRepository } from "./expenses.repository";
import {
  CreateExpenseInput,
  ExpenseQueryInput,
  UpdateExpenseInput,
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

export const expensesService = {
  async create(userId: string, input: CreateExpenseInput) {
    const expense = await expensesRepository.create({ userId, ...input });
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
    return formatExpense(updated);
  },

  async delete(userId: string, id: string) {
    const existing = await expensesRepository.findById(id, userId);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Expense not found");
    await expensesRepository.softDelete(id);
  },
};
