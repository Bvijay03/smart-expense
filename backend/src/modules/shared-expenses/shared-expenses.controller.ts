import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { sharedExpensesService } from "./shared-expenses.service";

export const sharedExpensesController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await sharedExpensesService.create(
        req.user!.userId,
        paramId(req, "groupId"),
        req.body,
      );
      res.status(201).json({ data: expense });
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expenses = await sharedExpensesService.list(
        req.user!.userId,
        paramId(req, "groupId"),
      );
      res.json({ data: expenses });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await sharedExpensesService.getById(
        req.user!.userId,
        paramId(req, "groupId"),
        paramId(req, "id"),
      );
      res.json({ data: expense });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await sharedExpensesService.delete(
        req.user!.userId,
        paramId(req, "groupId"),
        paramId(req, "id"),
      );
      res.json({ data: { message: "Shared expense deleted" } });
    } catch (err) {
      next(err);
    }
  },
};
