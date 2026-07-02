import { AppError } from "@/utils/app-error";
import { decimalToNumber } from "@/utils/helpers";
import { expensesRepository } from "@/modules/expenses/expenses.repository";
import { recurringRepository } from "./recurring.repository";
import { CreateRecurringInput, UpdateRecurringInput } from "./recurring.schema";

function formatRecurring(r: {
  id: string;
  userId: string;
  amount: { toString(): string };
  category: string;
  notes: string | null;
  dayOfMonth: number;
  isActive: boolean;
  lastCreated: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    userId: r.userId,
    amount: decimalToNumber(r.amount),
    category: r.category,
    notes: r.notes,
    dayOfMonth: r.dayOfMonth,
    isActive: r.isActive,
    lastCreated: r.lastCreated,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export const recurringService = {
  async list(userId: string) {
    const items = await recurringRepository.findByUser(userId);
    return items.map(formatRecurring);
  },

  async create(userId: string, input: CreateRecurringInput) {
    const item = await recurringRepository.create({ userId, ...input });
    return formatRecurring(item);
  },

  async update(userId: string, id: string, input: UpdateRecurringInput) {
    const existing = await recurringRepository.findById(id, userId);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Recurring expense not found");
    const updated = await recurringRepository.update(id, input);
    return formatRecurring(updated);
  },

  async toggleActive(userId: string, id: string) {
    const existing = await recurringRepository.findById(id, userId);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Recurring expense not found");
    const updated = await recurringRepository.update(id, { isActive: !existing.isActive });
    return formatRecurring(updated);
  },

  async delete(userId: string, id: string) {
    const existing = await recurringRepository.findById(id, userId);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Recurring expense not found");
    await recurringRepository.delete(id);
  },

  async processAll() {
    const dueItems = await recurringRepository.findDueToday();
    let created = 0;

    for (const item of dueItems) {
      try {
        await expensesRepository.create({
          userId: item.userId,
          amount: Number(item.amount),
          category: item.category,
          expenseDate: new Date(),
          notes: item.notes ? `[Recurring] ${item.notes}` : "[Recurring]",
        });
        await recurringRepository.markCreated(item.id);
        created++;
      } catch (err) {
        console.error(`Failed to process recurring ${item.id}:`, err);
      }
    }

    return { processed: dueItems.length, created };
  },
};
