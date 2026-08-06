import { Response, NextFunction } from "express";
import { sendFriendRequestSchema } from "./friends.schema";
import { friendsService } from "./friends.service";
import { AuthRequest } from "@/middlewares/auth.middleware";

export const friendsController = {
  async sendRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = sendFriendRequestSchema.parse(req.body);
      const friendship = await friendsService.sendRequest(req.user!.userId, email);
      res.status(201).json({ data: friendship, message: "Friend request sent" });
    } catch (err) {
      next(err);
    }
  },

  async acceptRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const friendship = await friendsService.acceptRequest(req.user!.userId, req.params.id as string);
      res.json({ data: friendship, message: "Friend request accepted" });
    } catch (err) {
      next(err);
    }
  },

  async rejectRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const friendship = await friendsService.rejectRequest(req.user!.userId, req.params.id as string);
      res.json({ data: friendship, message: "Friend request rejected" });
    } catch (err) {
      next(err);
    }
  },

  async getRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const requests = await friendsService.getRequests(req.user!.userId);
      res.json({ data: requests, message: "Pending friend requests" });
    } catch (err) {
      next(err);
    }
  },

  async getFriends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const friends = await friendsService.getFriendsWithBalances(req.user!.userId);
      res.json({ data: friends, message: "Friends list" });
    } catch (err) {
      next(err);
    }
  },
};
