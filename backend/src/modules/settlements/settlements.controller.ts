import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { settlementsService } from "./settlements.service";

export const settlementsController = {
  async getBalances(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const balances = await settlementsService.getBalances(
        req.user!.userId,
        paramId(req, "groupId"),
      );
      res.json({ data: balances });
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settlements = await settlementsService.list(
        req.user!.userId,
        paramId(req, "groupId"),
      );
      res.json({ data: settlements });
    } catch (err) {
      next(err);
    }
  },

  async markSettled(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settlement = await settlementsService.markSettled(
        req.user!.userId,
        paramId(req, "id"),
      );
      res.json({ data: settlement });
    } catch (err) {
      next(err);
    }
  },
};
