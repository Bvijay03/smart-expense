import { prisma } from "@/database/prisma";

export const categoriesRepository = {
  findByUser(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  },

  create(data: { userId: string; name: string; icon: string; color: string }) {
    return prisma.category.create({ data });
  },

  findById(id: string, userId: string) {
    return prisma.category.findFirst({ where: { id, userId } });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
