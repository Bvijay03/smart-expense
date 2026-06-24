import { prisma } from "@/database/prisma";
import { GroupRole } from "../../../generated/prisma/client";

export const groupsRepository = {
  create(data: { name: string; description?: string; createdById: string }) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description,
          createdById: data.createdById,
        },
      });
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: data.createdById,
          role: GroupRole.ADMIN,
        },
      });
      return group;
    });
  },

  findById(id: string) {
    return prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  findByUserId(userId: string) {
    return prisma.group.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { sharedExpenses: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  isMember(groupId: string, userId: string) {
    return prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  },

  isAdmin(groupId: string, userId: string) {
    return prisma.groupMember.findFirst({
      where: { groupId, userId, role: GroupRole.ADMIN },
    });
  },

  update(id: string, data: { name?: string; description?: string }) {
    return prisma.group.update({ where: { id }, data });
  },

  softDelete(id: string) {
    return prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  addMember(groupId: string, userId: string) {
    return prisma.groupMember.create({
      data: { groupId, userId, role: GroupRole.MEMBER },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  removeMember(groupId: string, userId: string) {
    return prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  },
};
