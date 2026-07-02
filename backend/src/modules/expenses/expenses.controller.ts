import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { expensesService } from "./expenses.service";

export const expensesController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.create(req.user!.userId, req.body);
      res.status(201).json({ data: expense });
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await expensesService.list(
        req.user!.userId,
        req.query as never,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.getById(
        req.user!.userId,
        paramId(req, "id"),
      );
      res.json({ data: expense });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.update(
        req.user!.userId,
        paramId(req, "id"),
        req.body,
      );
      res.json({ data: expense });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await expensesService.delete(req.user!.userId, paramId(req, "id"));
      res.json({ data: { message: "Expense deleted" } });
    } catch (err) {
      next(err);
    }
  },

  async moveToGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await expensesService.moveToGroup(
        req.user!.userId,
        paramId(req, "id"),
        req.body,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async exportCsv(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { groupId } = req.query as { groupId?: string };
      const csv = await expensesService.exportCsv(req.user!.userId, groupId);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${groupId ? "group-expenses" : "expenses"}.csv"`,
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
};
