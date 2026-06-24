import { AppError } from "@/utils/app-error";
import { decimalToNumber, roundMoney } from "@/utils/helpers";
import { groupsService } from "@/modules/groups/groups.service";
import { settlementsService } from "@/modules/settlements/settlements.service";
import { sharedExpensesRepository } from "./shared-expenses.repository";
import { CreateSharedExpenseInput } from "./shared-expenses.schema";

function computeSplits(
  amount: number,
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE",
  splits: { userId: string; value: number }[],
): { userId: string; amountOwed: number }[] {
  if (splitType === "EQUAL") {
    const share = roundMoney(amount / splits.length);
    const result = splits.map((s, i) => ({
      userId: s.userId,
      amountOwed: i === splits.length - 1
        ? roundMoney(amount - share * (splits.length - 1))
        : share,
    }));
    return result;
  }

  if (splitType === "EXACT") {
    const total = splits.reduce((sum, s) => sum + s.value, 0);
    if (roundMoney(total) !== roundMoney(amount)) {
      throw new AppError(
        400,
        "INVALID_SPLIT",
        "Split amounts must sum to expense amount",
      );
    }
    return splits.map((s) => ({
      userId: s.userId,
      amountOwed: roundMoney(s.value),
    }));
  }

  const totalPercent = splits.reduce((sum, s) => sum + s.value, 0);
  if (roundMoney(totalPercent) !== 100) {
    throw new AppError(
      400,
      "INVALID_SPLIT",
      "Split percentages must sum to 100",
    );
  }

  let allocated = 0;
  return splits.map((s, i) => {
    if (i === splits.length - 1) {
      return { userId: s.userId, amountOwed: roundMoney(amount - allocated) };
    }
    const owed = roundMoney((amount * s.value) / 100);
    allocated += owed;
    return { userId: s.userId, amountOwed: owed };
  });
}

function formatSharedExpense(expense: NonNullable<
  Awaited<ReturnType<typeof sharedExpensesRepository.findById>>
>) {
  return {
    id: expense.id,
    groupId: expense.groupId,
    description: expense.description,
    amount: decimalToNumber(expense.amount),
    category: expense.category,
    expenseDate: expense.expenseDate,
    splitType: expense.splitType,
    paidBy: expense.paidBy,
    splits: expense.splits.map((s: { userId: string; amountOwed: { toString(): string }; user: { id: string; name: string; email: string } }) => ({
      userId: s.userId,
      amountOwed: decimalToNumber(s.amountOwed),
      user: s.user,
    })),
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export const sharedExpensesService = {
  async create(
    userId: string,
    groupId: string,
    input: CreateSharedExpenseInput,
  ) {
    await groupsService.ensureMember(groupId, userId);

    const memberIds = input.splits.map((s) => s.userId);
    for (const memberId of memberIds) {
      await groupsService.ensureMember(groupId, memberId);
    }

    await groupsService.ensureMember(groupId, input.paidById);

    const computedSplits = computeSplits(
      input.amount,
      input.splitType,
      input.splits,
    );

    const expense = await sharedExpensesRepository.create({
      groupId,
      paidById: input.paidById,
      description: input.description,
      amount: input.amount,
      category: input.category,
      expenseDate: input.expenseDate,
      splitType: input.splitType,
      splits: computedSplits,
    });

    await settlementsService.recalculate(groupId);

    return formatSharedExpense(expense!);
  },

  async list(userId: string, groupId: string) {
    await groupsService.ensureMember(groupId, userId);
    const expenses = await sharedExpensesRepository.findByGroup(groupId);
    return expenses.map((e) => formatSharedExpense(e));
  },

  async getById(userId: string, groupId: string, id: string) {
    await groupsService.ensureMember(groupId, userId);
    const expense = await sharedExpensesRepository.findById(id, groupId);
    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense not found");
    return formatSharedExpense(expense);
  },

  async delete(userId: string, groupId: string, id: string) {
    await groupsService.ensureMember(groupId, userId);
    const expense = await sharedExpensesRepository.findById(id, groupId);
    if (!expense) throw new AppError(404, "NOT_FOUND", "Expense not found");
    await sharedExpensesRepository.softDelete(id);
    await settlementsService.recalculate(groupId);
  },
};
