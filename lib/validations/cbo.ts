import { z } from 'zod';

export const cboSchema = z.object({
  partner_agency_id: z
    .string()
    .min(1, { message: 'Please select a Partner Agency.' }),
  name: z
    .string()
    .min(2, { message: 'CBO name must be at least 2 characters.' })
    .max(100, { message: 'CBO name must be less than 100 characters.' })
    .trim(),
});

export type CBOFormValues = z.infer<typeof cboSchema>;

