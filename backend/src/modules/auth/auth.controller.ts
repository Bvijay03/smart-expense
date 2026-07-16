import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { authService } from "./auth.service";

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.userId);
      res.json({ data: { message: "Logged out successfully" } });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body);
      res.json({ data: { message: "Password updated successfully." } });
    } catch (err) {
      next(err);
    }
  },

  async updateSecurityQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.updateSecurityQuestion(req.user!.userId, req.body);
      res.json({ data: { message: "Security question updated successfully." } });
    } catch (err) {
      next(err);
    }
  }
};
