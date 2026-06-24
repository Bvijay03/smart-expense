import { prisma } from "@/database/prisma";
import { NotificationType, Prisma } from "../../../generated/prisma/client";

export const notificationsRepository = {
  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  },

  findByUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  findById(id: string, userId: string) {
    return prisma.notification.findFirst({ where: { id, userId } });
  },

  markRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },
};
