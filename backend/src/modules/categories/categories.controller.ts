import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { categoriesService } from "./categories.service";
import { createCategorySchema } from "./categories.schema";

export const categoriesController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await categoriesService.list(req.user!.userId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = createCategorySchema.parse(req.body);
      const data = await categoriesService.create(req.user!.userId, input);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await categoriesService.delete(req.user!.userId, req.params.id as string);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
