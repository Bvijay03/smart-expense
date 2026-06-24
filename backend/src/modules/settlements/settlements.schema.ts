import { z } from "zod";

export const groupIdParamSchema = z.object({
  groupId: z.uuid(),
});

export const settlementIdSchema = z.object({
  id: z.uuid(),
});
