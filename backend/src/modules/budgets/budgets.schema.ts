import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/utils/helpers";

export const createBudgetSchema = z.object({
  category: z.enum([...EXPENSE_CATEGORIES, "ALL"] as const).default("ALL"),
  amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = z.object({
  amount: z.coerce.number().positive(),
});

export const budgetIdSchema = z.object({
  id: z.uuid(),
});

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
