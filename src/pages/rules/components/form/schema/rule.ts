import { z } from 'zod';

export const baseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string()
          .min(2, { message: 'Name should be at least two character long' })
          .max(255, { message: 'Name is too long' }),
  description: z.string().nullable().optional(),
  url_pattern: z.string()
                .min(1, { message: 'Name should be at least two character long' })
                .max(255, { message: 'Name is too long' }),
  advanced_filters: z.any(),
});
