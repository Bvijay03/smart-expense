import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { budgetsService } from "./budgets.service";

export const budgetsController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const budget = await budgetsService.create(req.user!.userId, req.body);
      res.status(201).json({ data: budget });
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query as { month?: number; year?: number };
      const budgets = await budgetsService.list(
        req.user!.userId,
        query.month,
        query.year,
      );
      res.json({ data: budgets });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const budget = await budgetsService.update(
        req.user!.userId,
        paramId(req, "id"),
        req.body,
      );
      res.json({ data: budget });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await budgetsService.delete(req.user!.userId, paramId(req, "id"));
      res.json({ data: { message: "Budget deleted" } });
    } catch (err) {
      next(err);
    }
  },
};
