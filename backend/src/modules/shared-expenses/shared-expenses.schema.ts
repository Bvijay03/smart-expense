import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/utils/helpers";

const splitEntrySchema = z.object({
  userId: z.uuid(),
  value: z.coerce.number().nonnegative(),
});

export const createSharedExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  category: z.string().min(1).max(50),
  expenseDate: z.coerce.date(),
  paidById: z.uuid(),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE"]),
  splits: z.array(splitEntrySchema).min(1),
});

export const updateSharedExpenseSchema = createSharedExpenseSchema.partial();

export const groupExpenseParamsSchema = z.object({
  groupId: z.uuid(),
});

export const sharedExpenseIdSchema = z.object({
  groupId: z.uuid(),
  id: z.uuid(),
});

export type CreateSharedExpenseInput = z.infer<typeof createSharedExpenseSchema>;
