import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { usersService } from "./users.service";

export const usersController = {
  async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateProfile(req.user!.userId, req.body);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async deleteMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await usersService.deleteAccount(req.user!.userId);
      res.json({ data: { message: "Account deleted" } });
    } catch (err) {
      next(err);
    }
  },
};
