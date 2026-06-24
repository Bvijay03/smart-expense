import { prisma } from "@/database/prisma";

export const budgetsRepository = {
  create(data: {
    userId: string;
    category: string;
    amount: number;
    month: number;
    year: number;
  }) {
    return prisma.budget.create({ data });
  },

  findByUser(userId: string, month?: number, year?: number) {
    return prisma.budget.findMany({
      where: {
        userId,
        ...(month && { month }),
        ...(year && { year }),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  },

  findById(id: string, userId: string) {
    return prisma.budget.findFirst({ where: { id, userId } });
  },

  update(id: string, amount: number) {
    return prisma.budget.update({ where: { id }, data: { amount } });
  },

  delete(id: string) {
    return prisma.budget.delete({ where: { id } });
  },
};
