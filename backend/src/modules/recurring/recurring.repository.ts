import { prisma } from "@/database/prisma";

export const recurringRepository = {
  findByUser(userId: string) {
    return prisma.recurringExpense.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string, userId: string) {
    return prisma.recurringExpense.findFirst({ where: { id, userId } });
  },

  create(data: {
    userId: string;
    amount: number;
    category: string;
    notes?: string;
    dayOfMonth: number;
  }) {
    return prisma.recurringExpense.create({ data });
  },

  update(id: string, data: Partial<{
    amount: number;
    category: string;
    notes: string | null;
    dayOfMonth: number;
    isActive: boolean;
  }>) {
    return prisma.recurringExpense.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.recurringExpense.delete({ where: { id } });
  },

  findDueToday() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        dayOfMonth,
        OR: [
          { lastCreated: null },
          {
            lastCreated: {
              lt: new Date(today.getFullYear(), today.getMonth(), 1),
            },
          },
        ],
      },
    });
  },

  markCreated(id: string) {
    return prisma.recurringExpense.update({
      where: { id },
      data: { lastCreated: new Date() },
    });
  },
};
