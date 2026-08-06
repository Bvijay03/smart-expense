import { AppError } from "@/utils/app-error";
import { friendsRepository } from "./friends.repository";
import { usersRepository } from "../users/users.repository";
import { settlementsRepository } from "../settlements/settlements.repository";
import { FriendRequestStatus } from "../../../generated/prisma/client";

export const friendsService = {
  async sendRequest(initiatorId: string, email: string) {
    const receiver = await usersRepository.findByEmail(email);
    if (!receiver) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }

    if (receiver.id === initiatorId) {
      throw new AppError(400, "BAD_REQUEST", "You cannot send a friend request to yourself");
    }

    const existing = await friendsRepository.findFriendship(initiatorId, receiver.id);
    if (existing) {
      if (existing.status === FriendRequestStatus.PENDING) {
        throw new AppError(400, "BAD_REQUEST", "Friend request already sent/pending");
      }
      if (existing.status === FriendRequestStatus.ACCEPTED) {
        throw new AppError(400, "BAD_REQUEST", "You are already friends");
      }
    }

    return friendsRepository.createFriendRequest(initiatorId, receiver.id);
  },

  async acceptRequest(userId: string, friendshipId: string) {
    const friendship = await friendsRepository.findFriendshipById(friendshipId);
    if (!friendship) {
      throw new AppError(404, "NOT_FOUND", "Friend request not found");
    }
    if (friendship.receiverId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not authorized to accept this request");
    }
    if (friendship.status !== FriendRequestStatus.PENDING) {
      throw new AppError(400, "BAD_REQUEST", "Friend request is not pending");
    }

    return friendsRepository.acceptFriendRequest(friendshipId, friendship.initiatorId, friendship.receiverId);
  },

  async rejectRequest(userId: string, friendshipId: string) {
    const friendship = await friendsRepository.findFriendshipById(friendshipId);
    if (!friendship) {
      throw new AppError(404, "NOT_FOUND", "Friend request not found");
    }
    if (friendship.receiverId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not authorized to reject this request");
    }
    if (friendship.status !== FriendRequestStatus.PENDING) {
      throw new AppError(400, "BAD_REQUEST", "Friend request is not pending");
    }

    return friendsRepository.rejectFriendRequest(friendshipId);
  },

  async getRequests(userId: string) {
    const requests = await friendsRepository.getFriendRequests(userId);
    return requests.map((req) => ({
      id: req.id,
      user: req.initiator,
      createdAt: req.createdAt,
    }));
  },

  async getFriendsWithBalances(userId: string) {
    const friendships = await friendsRepository.getFriends(userId);

    const results = [];
    for (const f of friendships) {
      const friend = f.initiatorId === userId ? f.receiver : f.initiator;
      let balance = 0; // positive means friend owes user, negative means user owes friend

      if (f.groupId) {
        const groupBalances = await settlementsRepository.getGroupBalances(f.groupId);
        // groupBalances returns { user_id, paid, owed }
        const userBal = groupBalances.find((b) => b.user_id === userId);
        const friendBal = groupBalances.find((b) => b.user_id === friend.id);

        if (userBal && friendBal) {
          const userNet = userBal.paid - userBal.owed;
          const friendNet = friendBal.paid - friendBal.owed;
          // In a 2 person group, userNet should be -friendNet
          balance = userNet;
        }
      }

      results.push({
        id: f.id,
        friend,
        groupId: f.groupId,
        balance, // if balance > 0, friend owes user. if balance < 0, user owes friend.
      });
    }

    return results;
  },
};
