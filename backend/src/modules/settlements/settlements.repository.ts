import { prisma } from "@/database/prisma";
import { SettlementStatus } from "../../../generated/prisma/client";

export const settlementsRepository = {
  deletePendingByGroup(groupId: string) {
    return prisma.settlement.deleteMany({
      where: { groupId, status: SettlementStatus.PENDING },
    });
  },

  createMany(
    groupId: string,
    settlements: { fromUserId: string; toUserId: string; amount: number }[],
  ) {
    return prisma.settlement.createMany({
      data: settlements.map((s) => ({
        groupId,
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: s.amount,
        status: SettlementStatus.PENDING,
      })),
    });
  },

  findByGroup(groupId: string) {
    return prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.settlement.findUnique({
      where: { id },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    });
  },

  markSettled(id: string) {
    return prisma.settlement.update({
      where: { id },
      data: { status: SettlementStatus.SETTLED, settledAt: new Date() },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    });
  },

  getGroupBalances(groupId: string) {
    return prisma.$queryRaw<
      { user_id: string; name: string; paid: number; owed: number }[]
    >`
      SELECT
        u.id as user_id,
        u.name,
        COALESCE((
          SELECT SUM(se.amount)::float
          FROM shared_expenses se
          WHERE se.group_id = ${groupId}
            AND se.paid_by = u.id
            AND se.deleted_at IS NULL
        ), 0) as paid,
        COALESCE((
          SELECT SUM(es.amount_owed)::float
          FROM expense_splits es
          JOIN shared_expenses se ON se.id = es.shared_expense_id
          WHERE se.group_id = ${groupId}
            AND es.user_id = u.id
            AND se.deleted_at IS NULL
        ), 0) as owed
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ${groupId}
    `;
  },
};
