import { roundMoney } from "@/utils/helpers";

export interface BalanceEntry {
  userId: string;
  net: number;
}

export interface SettlementSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export function computeNetBalances(
  userIds: string[],
  paid: Record<string, number>,
  owed: Record<string, number>,
): BalanceEntry[] {
  return userIds.map((userId) => ({
    userId,
    net: roundMoney((paid[userId] ?? 0) - (owed[userId] ?? 0)),
  }));
}

export function minCashFlow(balances: BalanceEntry[]): SettlementSuggestion[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.net > 0.01) creditors.push({ userId: b.userId, amount: b.net });
    else if (b.net < -0.01) debtors.push({ userId: b.userId, amount: -b.net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementSuggestion[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amount = roundMoney(Math.min(creditors[i].amount, debtors[j].amount));
    if (amount > 0) {
      settlements.push({
        fromUserId: debtors[j].userId,
        toUserId: creditors[i].userId,
        amount,
      });
    }
    creditors[i].amount = roundMoney(creditors[i].amount - amount);
    debtors[j].amount = roundMoney(debtors[j].amount - amount);
    if (creditors[i].amount <= 0.01) i++;
    if (debtors[j].amount <= 0.01) j++;
  }

  return settlements;
}
