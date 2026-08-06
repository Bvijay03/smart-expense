import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;
