import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middlewares/auth.middleware";
import { paramId } from "@/utils/params";
import { groupsService } from "./groups.service";

export const groupsController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.create(req.user!.userId, req.body);
      res.status(201).json({ data: group });
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const groups = await groupsService.list(req.user!.userId);
      res.json({ data: groups });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.getById(
        req.user!.userId,
        paramId(req, "id"),
      );
      res.json({ data: group });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const group = await groupsService.update(
        req.user!.userId,
        paramId(req, "id"),
        req.body,
      );
      res.json({ data: group });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await groupsService.delete(req.user!.userId, paramId(req, "id"));
      res.json({ data: { message: "Group deleted" } });
    } catch (err) {
      next(err);
    }
  },

  async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const member = await groupsService.addMember(
        req.user!.userId,
        paramId(req, "id"),
        req.body,
      );
      res.status(201).json({ data: member });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await groupsService.removeMember(
        req.user!.userId,
        paramId(req, "id"),
        paramId(req, "memberId"),
      );
      res.json({ data: { message: "Member removed" } });
    } catch (err) {
      next(err);
    }
  },

  // ── Invite Code ──────────────────────────────────────────────

  async generateInviteCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.generateInviteCode(
        req.user!.userId,
        paramId(req, "id"),
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async joinByCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.joinByCode(
        req.user!.userId,
        req.body.inviteCode,
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async listJoinRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const requests = await groupsService.listJoinRequests(
        req.user!.userId,
        paramId(req, "id"),
      );
      res.json({ data: requests });
    } catch (err) {
      next(err);
    }
  },

  async handleJoinRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await groupsService.handleJoinRequest(
        req.user!.userId,
        paramId(req, "id"),
        req.params.requestId as string,
        req.body,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
};
