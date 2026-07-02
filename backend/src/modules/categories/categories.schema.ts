import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  icon: z.string().default("pricetag-outline"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#4F46E5"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
