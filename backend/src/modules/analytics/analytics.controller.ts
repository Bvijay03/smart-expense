import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { analyticsService } from "./analytics.service";

export const analyticsController = {
  async summary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.summary(
        req.user!.userId,
        req.query,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async byCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.byCategory(
        req.user!.userId,
        req.query,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async trends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.trends(
        req.user!.userId,
        req.query,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await analyticsService.exportCsv(req.user!.userId, req.query);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="analytics.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
};
