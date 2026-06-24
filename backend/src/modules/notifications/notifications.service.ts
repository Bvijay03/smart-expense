import { AppError } from "@/utils/app-error";
import { NotificationType } from "../../../generated/prisma/client";
import { notificationsRepository } from "./notifications.repository";
import { CreateNotificationInput } from "./notifications.schema";

export const notificationsService = {
  async create(input: CreateNotificationInput) {
    return notificationsRepository.create({
      userId: input.userId,
      type: NotificationType[input.type],
      title: input.title,
      body: input.body,
      metadata: input.metadata,
    });
  },

  async list(userId: string) {
    const notifications = await notificationsRepository.findByUser(userId);
    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      metadata: n.metadata,
      createdAt: n.createdAt,
    }));
  },

  async markRead(userId: string, id: string) {
    const notification = await notificationsRepository.findById(id, userId);
    if (!notification) {
      throw new AppError(404, "NOT_FOUND", "Notification not found");
    }
    const updated = await notificationsRepository.markRead(id);
    return {
      id: updated.id,
      read: updated.read,
    };
  },

  async markAllRead(userId: string) {
    await notificationsRepository.markAllRead(userId);
  },
};
