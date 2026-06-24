import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  description: z.string().max(500).optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const addMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address").optional(),
});

export const groupIdSchema = z.object({
  id: z.uuid(),
});

export const memberIdSchema = z.object({
  id: z.uuid(),
  memberId: z.uuid(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
