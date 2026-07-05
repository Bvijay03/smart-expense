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

  async findByUserIdWithBalances(userId: string) {
    const groups = await prisma.group.findMany({
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

    // For each group, calculate user's contribution (paid) and net balance (owed - paid)
    const groupIds = groups.map((g) => g.id);

    if (groupIds.length === 0) {
      return groups.map((g) => ({
        ...g,
        userContribution: 0,
        userNetBalance: 0,
      }));
    }

    const [contributions, owedPerGroup] = await Promise.all([
      // Total paid by user per group
      prisma.sharedExpense.groupBy({
        by: ["groupId"],
        where: {
          groupId: { in: groupIds },
          paidById: userId,
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      // Total owed by user per group — use a separate query per group
      // since Prisma can't groupBy a relation field directly
      Promise.all(
        groupIds.map(async (gId) => {
          const result = await prisma.expenseSplit.aggregate({
            where: {
              userId,
              sharedExpense: {
                groupId: gId,
                deletedAt: null,
              },
            },
            _sum: { amountOwed: true },
          });
          return { groupId: gId, totalOwed: Number(result._sum.amountOwed ?? 0) };
        })
      ),
    ]);

    const contributionMap = new Map(
      contributions.map((c) => [c.groupId, Number(c._sum.amount ?? 0)])
    );
    const owedMap = new Map(
      owedPerGroup.map((o) => [o.groupId, o.totalOwed])
    );

    return groups.map((g) => ({
      ...g,
      userContribution: contributionMap.get(g.id) ?? 0,
      // net > 0 means group owes user; net < 0 means user owes group
      userNetBalance: (contributionMap.get(g.id) ?? 0) - (owedMap.get(g.id) ?? 0),
    }));
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

  setInviteCode(groupId: string, code: string, expiresAt: Date) {
    return prisma.group.update({
      where: { id: groupId },
      data: { inviteCode: code, inviteCodeExp: expiresAt },
    });
  },

  findByInviteCode(code: string) {
    return prisma.group.findUnique({
      where: { inviteCode: code },
    });
  },

  createJoinRequest(groupId: string, userId: string) {
    return prisma.joinRequest.create({
      data: { groupId, userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    });
  },

  findJoinRequest(requestId: string) {
    return prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    });
  },

  findPendingRequests(groupId: string) {
    return prisma.joinRequest.findMany({
      where: { groupId, status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateJoinRequestStatus(requestId: string, status: "APPROVED" | "REJECTED") {
    return prisma.joinRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    });
  },

  findExistingJoinRequest(groupId: string, userId: string) {
    return prisma.joinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  },

  getAdmins(groupId: string) {
    return prisma.groupMember.findMany({
      where: { groupId, role: GroupRole.ADMIN },
      select: { userId: true },
    });
  },
};