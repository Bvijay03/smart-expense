import { AppError } from "@/utils/app-error";
import { NotificationType } from "../../../generated/prisma/client";
import { notificationsRepository } from "./notifications.repository";
import { CreateNotificationInput } from "./notifications.schema";
import { notificationService as pushService } from "@/services/notificationService";
import { usersRepository } from "@/modules/users/users.repository";

export const notificationsService = {
  async create(input: CreateNotificationInput) {
    const notification = await notificationsRepository.create({
      userId: input.userId,
      type: NotificationType[input.type],
      title: input.title,
      body: input.body,
      metadata: input.metadata,
    });

    // Send push notification if user has a token
    try {
      const user = await usersRepository.findById(input.userId);
      if (user && user.pushToken) {
        await pushService.sendPushNotification({
          to: user.pushToken,
          title: input.title,
          body: input.body,
          data: { type: input.type, ...input.metadata },
        });
      }
    } catch (err) {
      console.error("Failed to send push notification:", err);
    }

    return notification;
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
