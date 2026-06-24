import { z } from "zod";
import { NotificationType } from "../../../generated/prisma/client";

export const notificationIdSchema = z.object({
  id: z.uuid(),
});

export type CreateNotificationInput = {
  userId: string;
  type: keyof typeof NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};
