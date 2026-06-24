import { z } from "zod";

export const analyticsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  year: z.coerce.number().int().optional(),
});
