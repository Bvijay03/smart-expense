import { prisma } from "@/database/prisma";
import { FriendRequestStatus, GroupRole } from "../../../generated/prisma/client";

export const friendsRepository = {
  createFriendRequest(initiatorId: string, receiverId: string) {
    return prisma.friendship.create({
      data: {
        initiatorId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      },
    });
  },

  findFriendship(userId1: string, userId2: string) {
    return prisma.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: userId1, receiverId: userId2 },
          { initiatorId: userId2, receiverId: userId1 },
        ],
      },
    });
  },

  findFriendshipById(id: string) {
    return prisma.friendship.findUnique({
      where: { id },
      include: {
        initiator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  },

  acceptFriendRequest(friendshipId: string, initiatorId: string, receiverId: string) {
    return prisma.$transaction(async (tx) => {
      // Create a 1-on-1 group
      const group = await tx.group.create({
        data: {
          name: "Friendship",
          createdById: receiverId,
        },
      });

      await tx.groupMember.createMany({
        data: [
          { groupId: group.id, userId: initiatorId, role: GroupRole.MEMBER },
          { groupId: group.id, userId: receiverId, role: GroupRole.MEMBER },
        ],
      });

      const friendship = await tx.friendship.update({
        where: { id: friendshipId },
        data: {
          status: FriendRequestStatus.ACCEPTED,
          groupId: group.id,
        },
      });

      return friendship;
    });
  },

  rejectFriendRequest(friendshipId: string) {
    return prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendRequestStatus.REJECTED },
    });
  },

  getFriendRequests(userId: string) {
    return prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getFriends(userId: string) {
    return prisma.friendship.findMany({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  },
};
