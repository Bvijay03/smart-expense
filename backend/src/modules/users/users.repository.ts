import { prisma } from "@/database/prisma";
import { randomUUID } from "crypto";

export const usersRepository = {
  findById(id: string) {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  },

  findByEmail(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  },

  update(id: string, data: { name?: string; avatarUrl?: string | null }) {
    return prisma.user.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  createGuest(name: string) {
    const guestEmail = `guest_${randomUUID()}@guest.local`;
    return prisma.user.create({
      data: {
        name,
        email: guestEmail,
        passwordHash: "",
      },
    });
  },
};
