import { z } from 'zod';

export const agencySchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Agency name must be at least 2 characters.' })
    .max(100, { message: 'Agency name must be less than 100 characters.' })
    .trim(),
});

export type AgencyFormValues = z.infer<typeof agencySchema>;

