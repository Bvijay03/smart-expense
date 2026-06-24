import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { notificationsService } from "./notifications.service";

export const notificationsController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationsService.list(req.user!.userId);
      res.json({ data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markRead(
        req.user!.userId,
        paramId(req, "id"),
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationsService.markAllRead(req.user!.userId);
      res.json({ data: { message: "All notifications marked as read" } });
    } catch (err) {
      next(err);
    }
  },
};
