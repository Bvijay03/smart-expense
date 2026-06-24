import { prisma } from "@/database/prisma";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Minimal reproduction of settlementsRecalculate logic to avoid circular/runtime module resolution issues
async function recalculateSettlements(groupId: string) {
  // Get all members of the group
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const userIds = members.map((m) => m.userId);

  // Get total paid by each member
  const paidRaw = await prisma.sharedExpense.groupBy({
    by: ["paidById"],
    where: { groupId, deletedAt: null },
    _sum: { amount: true },
  });

  // Get total owed by each member
  const owedRaw = await prisma.expenseSplit.groupBy({
    by: ["userId"],
    where: { sharedExpense: { groupId, deletedAt: null } },
    _sum: { amountOwed: true },
  });

  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};

  for (const userId of userIds) {
    paid[userId] = 0;
    owed[userId] = 0;
  }

  for (const p of paidRaw) {
    paid[p.paidById] = Number(p._sum.amount ?? 0);
  }

  for (const o of owedRaw) {
    owed[o.userId] = Number(o._sum.amountOwed ?? 0);
  }

  // Compute net balances
  const nets = userIds.map((userId) => ({
    userId,
    net: Math.round(((paid[userId] ?? 0) - (owed[userId] ?? 0)) * 100) / 100,
  }));

  // Min cash flow algorithm
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const b of nets) {
    if (b.net > 0.01) creditors.push({ userId: b.userId, amount: b.net });
    else if (b.net < -0.01) debtors.push({ userId: b.userId, amount: -b.net });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: { fromUserId: string; toUserId: string; amount: number }[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.round(Math.min(creditors[i].amount, debtors[j].amount) * 100) / 100;
    if (amount > 0) {
      settlements.push({
        fromUserId: debtors[j].userId,
        toUserId: creditors[i].userId,
        amount,
      });
    }
    creditors[i].amount = Math.round((creditors[i].amount - amount) * 100) / 100;
    debtors[j].amount = Math.round((debtors[j].amount - amount) * 100) / 100;
    if (creditors[i].amount <= 0.01) i++;
    if (debtors[j].amount <= 0.01) j++;
  }

  // Delete pending settlements
  await prisma.settlement.deleteMany({
    where: { groupId, status: "PENDING" },
  });

  // Create new settlements
  if (settlements.length > 0) {
    await prisma.settlement.createMany({
      data: settlements.map((s) => ({
        groupId,
        fromUserId: s.fromUserId,
        toUserId: s.toUserId,
        amount: s.amount,
        status: "PENDING",
      })),
    });
  }
}

async function main() {
  console.log("Cleaning database...");
  await prisma.notification.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.sharedExpense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const passwordHash = await hashPassword("password123");

  const user1 = await prisma.user.create({
    data: {
      email: "user1@example.com",
      name: "Vijay Kumar",
      passwordHash,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@example.com",
      name: "Amith Raj",
      passwordHash,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amith",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "user3@example.com",
      name: "Siddharth Jain",
      passwordHash,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Siddharth",
    },
  });

  console.log("Seeding personal expenses...");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed for Prisma budget/analytics

  // Personal expenses for Vijay
  await prisma.expense.createMany({
    data: [
      {
        userId: user1.id,
        amount: 250.0,
        category: "Food",
        expenseDate: new Date(currentYear, currentMonth - 1, 10),
        notes: "Lunch at office",
      },
      {
        userId: user1.id,
        amount: 1500.0,
        category: "Bills",
        expenseDate: new Date(currentYear, currentMonth - 1, 5),
        notes: "Mobile recharge & internet",
      },
      {
        userId: user1.id,
        amount: 1200.0,
        category: "Shopping",
        expenseDate: new Date(currentYear, currentMonth - 1, 12),
        notes: "New shirt",
      },
    ],
  });

  // Personal expenses for Amith
  await prisma.expense.createMany({
    data: [
      {
        userId: user2.id,
        amount: 350.0,
        category: "Transport",
        expenseDate: new Date(currentYear, currentMonth - 1, 8),
        notes: "Uber ride",
      },
      {
        userId: user2.id,
        amount: 800.0,
        category: "Food",
        expenseDate: new Date(currentYear, currentMonth - 1, 11),
        notes: "Dinner with friends",
      },
    ],
  });

  console.log("Seeding groups...");
  const group = await prisma.group.create({
    data: {
      name: "Flat 404 Roommates",
      description: "Expenses for our shared flat bills and groceries",
      createdById: user1.id,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: user1.id, role: "ADMIN" },
      { groupId: group.id, userId: user2.id, role: "MEMBER" },
      { groupId: group.id, userId: user3.id, role: "MEMBER" },
    ],
  });

  console.log("Seeding shared expenses...");
  // 1. Wifi Bill: 999 paid by Vijay, split equally
  const sharedExpense1 = await prisma.sharedExpense.create({
    data: {
      groupId: group.id,
      paidById: user1.id,
      description: "WiFi Broadband Bill",
      amount: 999.0,
      category: "Bills",
      expenseDate: new Date(currentYear, currentMonth - 1, 1),
      splitType: "EQUAL",
    },
  });

  await prisma.expenseSplit.createMany({
    data: [
      { sharedExpenseId: sharedExpense1.id, userId: user1.id, amountOwed: 333.0 },
      { sharedExpenseId: sharedExpense1.id, userId: user2.id, amountOwed: 333.0 },
      { sharedExpenseId: sharedExpense1.id, userId: user3.id, amountOwed: 333.0 },
    ],
  });

  // 2. Groceries: 1500 paid by Amith, split equally
  const sharedExpense2 = await prisma.sharedExpense.create({
    data: {
      groupId: group.id,
      paidById: user2.id,
      description: "Weekly Grocery Shopping",
      amount: 1500.0,
      category: "Food",
      expenseDate: new Date(currentYear, currentMonth - 1, 6),
      splitType: "EQUAL",
    },
  });

  await prisma.expenseSplit.createMany({
    data: [
      { sharedExpenseId: sharedExpense2.id, userId: user1.id, amountOwed: 500.0 },
      { sharedExpenseId: sharedExpense2.id, userId: user2.id, amountOwed: 500.0 },
      { sharedExpenseId: sharedExpense2.id, userId: user3.id, amountOwed: 500.0 },
    ],
  });

  // 3. Dinner: 3000 paid by Siddharth, exact splits
  const sharedExpense3 = await prisma.sharedExpense.create({
    data: {
      groupId: group.id,
      paidById: user3.id,
      description: "Weekend Celebratory Dinner",
      amount: 3000.0,
      category: "Food",
      expenseDate: new Date(currentYear, currentMonth - 1, 15),
      splitType: "EXACT",
    },
  });

  await prisma.expenseSplit.createMany({
    data: [
      { sharedExpenseId: sharedExpense3.id, userId: user1.id, amountOwed: 1000.0 },
      { sharedExpenseId: sharedExpense3.id, userId: user2.id, amountOwed: 1200.0 },
      { sharedExpenseId: sharedExpense3.id, userId: user3.id, amountOwed: 800.0 },
    ],
  });

  console.log("Calculating group settlements...");
  await recalculateSettlements(group.id);

  console.log("Seeding budgets...");
  await prisma.budget.createMany({
    data: [
      {
        userId: user1.id,
        category: "ALL",
        amount: 10000.0,
        month: currentMonth,
        year: currentYear,
      },
      {
        userId: user1.id,
        category: "Food",
        amount: 3000.0,
        month: currentMonth,
        year: currentYear,
      },
      {
        userId: user2.id,
        category: "ALL",
        amount: 8000.0,
        month: currentMonth,
        year: currentYear,
      },
    ],
  });

  console.log("Seeding notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: user1.id,
        type: "GROUP_INVITE",
        title: "Joined Flat 404 Roommates",
        body: "Vijay Kumar created the group and added you.",
        read: true,
      },
      {
        userId: user1.id,
        type: "SETTLEMENT_REMINDER",
        title: "New Settlement Calculated",
        body: "You owe Siddharth Jain ₹1167.00 in Flat 404 Roommates.",
        read: false,
      },
      {
        userId: user2.id,
        type: "SETTLEMENT_REMINDER",
        title: "New Settlement Calculated",
        body: "You owe Siddharth Jain ₹867.00 in Flat 404 Roommates.",
        read: false,
      },
    ],
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
