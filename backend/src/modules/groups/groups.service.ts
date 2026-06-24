import { AppError } from "@/utils/app-error";
import { usersRepository } from "@/modules/users/users.repository";
import { notificationsService } from "@/modules/notifications/notifications.service";
import { groupsRepository } from "./groups.repository";
import {
  AddMemberInput,
  CreateGroupInput,
  UpdateGroupInput,
} from "./groups.schema";

function formatGroup(group: {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  members?: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
  }>;
  createdBy?: { id: string; name: string; email: string };
  _count?: { sharedExpenses: number };
}) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdById: group.createdById,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    members: group.members?.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
    createdBy: group.createdBy,
    expenseCount: group._count?.sharedExpenses,
  };
}

export const groupsService = {
  async create(userId: string, input: CreateGroupInput) {
    const group = await groupsRepository.create({
      ...input,
      createdById: userId,
    });
    const full = await groupsRepository.findById(group.id);
    return formatGroup(full!);
  },

  async list(userId: string) {
    const groups = await groupsRepository.findByUserId(userId);
    return groups.map(formatGroup);
  },

  async getById(userId: string, groupId: string) {
    await this.ensureMember(groupId, userId);
    const group = await groupsRepository.findById(groupId);
    if (!group) throw new AppError(404, "NOT_FOUND", "Group not found");
    return formatGroup(group);
  },

  async update(userId: string, groupId: string, input: UpdateGroupInput) {
    await this.ensureAdmin(groupId, userId);
    const group = await groupsRepository.findById(groupId);
    if (!group) throw new AppError(404, "NOT_FOUND", "Group not found");
    await groupsRepository.update(groupId, input);
    const updated = await groupsRepository.findById(groupId);
    return formatGroup(updated!);
  },

  async delete(userId: string, groupId: string) {
    await this.ensureAdmin(groupId, userId);
    await groupsRepository.softDelete(groupId);
  },

  async addMember(userId: string, groupId: string, input: AddMemberInput) {
    await this.ensureAdmin(groupId, userId);

    let invitee;

    if (input.email) {
      // If email provided, look up existing registered user
      invitee = await usersRepository.findByEmail(input.email);
      if (!invitee) {
        // Email given but no registered user found — create a guest with that name
        invitee = await usersRepository.createGuest(input.name);
      }
    } else {
      // No email — create a guest user with just the name
      invitee = await usersRepository.createGuest(input.name);
    }

    const existing = await groupsRepository.isMember(groupId, invitee.id);
    if (existing) {
      throw new AppError(409, "ALREADY_MEMBER", "User is already a member");
    }

    const member = await groupsRepository.addMember(groupId, invitee.id);
    const group = await groupsRepository.findById(groupId);

    await notificationsService.create({
      userId: invitee.id,
      type: "GROUP_INVITE",
      title: "Added to group",
      body: `You were added to group "${group!.name}"`,
      metadata: { groupId },
    });

    return {
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  },

  async removeMember(
    userId: string,
    groupId: string,
    memberUserId: string,
  ) {
    await this.ensureAdmin(groupId, userId);
    if (userId === memberUserId) {
      throw new AppError(400, "INVALID", "Cannot remove yourself as admin");
    }
    await groupsRepository.removeMember(groupId, memberUserId);
  },

  async ensureMember(groupId: string, userId: string) {
    const member = await groupsRepository.isMember(groupId, userId);
    if (!member) {
      throw new AppError(403, "FORBIDDEN", "Not a member of this group");
    }
    return member;
  },

  async ensureAdmin(groupId: string, userId: string) {
    const admin = await groupsRepository.isAdmin(groupId, userId);
    if (!admin) {
      throw new AppError(403, "FORBIDDEN", "Admin access required");
    }
  },
};
