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

    const updated = await settlementsRepository.markSettled(settlementId);

    await notificationsService.create({
      userId: settlement.toUserId,
      type: "SETTLEMENT_REMINDER",
      title: "Settlement completed",
      body: `${settlement.fromUser.name} marked a settlement of ₹${decimalToNumber(settlement.amount)} as paid`,
      metadata: { settlementId, groupId: settlement.groupId },
    });

    return formatSettlement(updated);
  },

  async settleWithAmount(userId: string, settlementId: string, paidAmount: number) {
    const settlement = await settlementsRepository.findById(settlementId);
    if (!settlement) {
      throw new AppError(404, "NOT_FOUND", "Settlement not found");
    }

    await groupsService.ensureMember(settlement.groupId, userId);

    if (settlement.status !== "PENDING") {
      throw new AppError(400, "BAD_REQUEST", "Settlement already settled");
    }

    const owedAmount = decimalToNumber(settlement.amount);
    const diff = roundMoney(paidAmount - owedAmount);

    // Mark current settlement as settled
    const updated = await settlementsRepository.markSettled(settlementId);

    let remainderInfo = "";

    if (diff < -0.01) {
      // Underpaid: fromUser still owes the remainder to toUser
      const remainder = roundMoney(-diff);
      await settlementsRepository.createMany(settlement.groupId, [
        { fromUserId: settlement.fromUserId, toUserId: settlement.toUserId, amount: remainder },
      ]);
      remainderInfo = ` (partial: ₹${remainder.toFixed(2)} still pending)`;
    } else if (diff > 0.01) {
      // Overpaid: toUser now owes the excess back to fromUser
      const excess = roundMoney(diff);
      await settlementsRepository.createMany(settlement.groupId, [
        { fromUserId: settlement.toUserId, toUserId: settlement.fromUserId, amount: excess },
      ]);
      remainderInfo = ` (overpaid by ₹${excess.toFixed(2)} — reverse settlement created)`;
    }

    // Notify the recipient
    await notificationsService.create({
      userId: settlement.toUserId,
      type: "SETTLEMENT_REMINDER",
      title: "Settlement payment received",
      body: `${settlement.fromUser.name} paid ₹${paidAmount.toFixed(2)} of ₹${owedAmount.toFixed(2)}${remainderInfo}`,
      metadata: { settlementId, groupId: settlement.groupId },
    });

    // Notify the payer too
    await notificationsService.create({
      userId: settlement.fromUserId,
      type: "SETTLEMENT_REMINDER",
      title: "Settlement recorded",
      body: `You paid ₹${paidAmount.toFixed(2)} to ${settlement.toUser.name}${remainderInfo}`,
      metadata: { settlementId, groupId: settlement.groupId },
    });

    return {
      settlement: formatSettlement(updated),
      paidAmount,
      owedAmount,
      diff,
      status: diff < -0.01 ? "PARTIAL" : diff > 0.01 ? "OVERPAID" : "EXACT",
    };
  },
};
