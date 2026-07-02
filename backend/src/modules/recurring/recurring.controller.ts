import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { recurringService } from "./recurring.service";
import { createRecurringSchema, updateRecurringSchema } from "./recurring.schema";

export const recurringController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await recurringService.list(req.user!.userId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createRecurringSchema.parse(req.body);
      const data = await recurringService.create(req.user!.userId, input);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = updateRecurringSchema.parse(req.body);
      const data = await recurringService.update(req.user!.userId, paramId(req, "id"), input);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await recurringService.toggleActive(req.user!.userId, paramId(req, "id"));
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await recurringService.delete(req.user!.userId, paramId(req, "id"));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },

  async process(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await recurringService.processAll();
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
};
