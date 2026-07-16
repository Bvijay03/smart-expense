import { prisma } from "@/database/prisma";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  },

  createUser(data: { email: string; passwordHash: string; name: string; securityQuestion?: string; securityAnswer?: string }) {
    return prisma.user.create({ data });
  },

  findUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  },

  createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokensByUserId(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
    });
  },

  deleteRefreshToken(id: string) {
    return prisma.refreshToken.delete({ where: { id } });
  },

  deleteAllRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },

  updateUser(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

};
