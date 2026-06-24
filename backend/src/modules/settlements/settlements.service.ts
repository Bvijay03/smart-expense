import { AppError } from "@/utils/app-error";
import { decimalToNumber, roundMoney } from "@/utils/helpers";
import { groupsService } from "@/modules/groups/groups.service";
import { notificationsService } from "@/modules/notifications/notifications.service";
import {
  computeNetBalances,
  minCashFlow,
} from "./settlement.engine";
import { settlementsRepository } from "./settlements.repository";

function formatSettlement(s: {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: { toString(): string };
  status: string;
  settledAt: Date | null;
  createdAt: Date;
  fromUser: { id: string; name: string; email: string };
  toUser: { id: string; name: string; email: string };
}) {
  return {
    id: s.id,
    groupId: s.groupId,
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: decimalToNumber(s.amount),
    status: s.status,
    settledAt: s.settledAt,
    createdAt: s.createdAt,
    fromUser: s.fromUser,
    toUser: s.toUser,
  };
}

export const settlementsService = {
  async recalculate(groupId: string) {
    const balancesRaw = await settlementsRepository.getGroupBalances(groupId);
    const userIds = balancesRaw.map((b) => b.user_id);
    const paid: Record<string, number> = {};
    const owed: Record<string, number> = {};

    for (const b of balancesRaw) {
      paid[b.user_id] = Number(b.paid);
      owed[b.user_id] = Number(b.owed);
    }

    const nets = computeNetBalances(userIds, paid, owed);
    const suggestions = minCashFlow(nets);

    await settlementsRepository.deletePendingByGroup(groupId);

    if (suggestions.length > 0) {
      await settlementsRepository.createMany(groupId, suggestions);
    }
  },

  async getBalances(userId: string, groupId: string) {
    await groupsService.ensureMember(groupId, userId);
    const balancesRaw = await settlementsRepository.getGroupBalances(groupId);

    return balancesRaw.map((b: { user_id: string; name: string; paid: number; owed: number }) => ({
      userId: b.user_id,
      name: b.name,
      paid: Number(b.paid),
      owed: Number(b.owed),
      net: roundMoney(Number(b.paid) - Number(b.owed)),
    }));
  },

  async list(userId: string, groupId: string) {
    await groupsService.ensureMember(groupId, userId);
    const settlements = await settlementsRepository.findByGroup(groupId);
    return settlements.map(formatSettlement);
  },

  async markSettled(userId: string, settlementId: string) {
    const settlement = await settlementsRepository.findById(settlementId);
    if (!settlement) {
      throw new AppError(404, "NOT_FOUND", "Settlement not found");
    }

    await groupsService.ensureMember(settlement.groupId, userId);

    if (
      settlement.fromUserId !== userId &&
      settlement.toUserId !== userId
    ) {
      throw new AppError(403, "FORBIDDEN", "Not part of this settlement");
    }

    const updated = await settlementsRepository.markSettled(settlementId);

    await notificationsService.create({
      userId: settlement.toUserId,
      type: "SETTLEMENT_REMINDER",
      title: "Settlement completed",
      body: `${settlement.fromUser.name} marked a settlement of ${decimalToNumber(settlement.amount)} as paid`,
      metadata: { settlementId, groupId: settlement.groupId },
    });

    return formatSettlement(updated);
  },
};
