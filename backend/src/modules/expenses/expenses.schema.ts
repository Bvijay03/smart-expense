import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1).max(50),
  expenseDate: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const expenseIdSchema = z.object({
  id: z.uuid(),
});

export const moveToGroupSchema = z.object({
  groupId: z.uuid(),
  description: z.string().min(1).max(200).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
export type MoveToGroupInput = z.infer<typeof moveToGroupSchema>;
