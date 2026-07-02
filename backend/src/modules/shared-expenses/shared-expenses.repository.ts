import { prisma } from "@/database/prisma";
import { SplitType } from "../../../generated/prisma/client";

export const sharedExpensesRepository = {
  create(data: {
    groupId: string;
    paidById: string;
    description: string;
    amount: number;
    category: string;
    expenseDate: Date;
    splitType: SplitType;
    splits: { userId: string; amountOwed: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const expense = await tx.sharedExpense.create({
        data: {
          groupId: data.groupId,
          paidById: data.paidById,
          description: data.description,
          amount: data.amount,
          category: data.category,
          expenseDate: data.expenseDate,
          splitType: data.splitType,
        },
      });

      await tx.expenseSplit.createMany({
        data: data.splits.map((s) => ({
          sharedExpenseId: expense.id,
          userId: s.userId,
          amountOwed: s.amountOwed,
        })),
      });

      return tx.sharedExpense.findUnique({
        where: { id: expense.id },
        include: {
          splits: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          paidBy: { select: { id: true, name: true, email: true } },
        },
      });
    });
  },

  findByGroup(groupId: string) {
    return prisma.sharedExpense.findMany({
      where: { groupId, deletedAt: null },
      include: {
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        paidBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { expenseDate: "desc" },
    });
  },

  findById(id: string, groupId: string) {
    return prisma.sharedExpense.findFirst({
      where: { id, groupId, deletedAt: null },
      include: {
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        paidBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  findAllForExport(groupId: string) {
    return prisma.sharedExpense.findMany({
      where: { groupId, deletedAt: null },
      include: {
        group: { select: { id: true, name: true } },
        paidBy: { select: { id: true, name: true, email: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    });
  },

  softDelete(id: string) {
    return prisma.sharedExpense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  getBalancesRaw(groupId: string) {
    return prisma.$queryRaw<
      { user_id: string; paid: number; owed: number }[]
    >`
      SELECT
        u.id as user_id,
        COALESCE(SUM(CASE WHEN se.paid_by = u.id THEN se.amount ELSE 0 END), 0)::float as paid,
        COALESCE(SUM(es.amount_owed), 0)::float as owed
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      LEFT JOIN shared_expenses se ON se.group_id = gm.group_id AND se.paid_by = u.id AND se.deleted_at IS NULL
      LEFT JOIN expense_splits es ON es.shared_expense_id = se.id AND es.user_id = u.id
      WHERE gm.group_id = ${groupId}::uuid
      GROUP BY u.id
    `;
  },
};
