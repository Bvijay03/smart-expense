import { z } from "zod";

export const createRecurringSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1).max(50),
  notes: z.string().max(500).optional(),
  dayOfMonth: z.coerce.number().int().min(1).max(28, "Day must be 1-28 to work for all months"),
});

export const updateRecurringSchema = createRecurringSchema.partial();

export const recurringIdSchema = z.object({
  id: z.uuid(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
