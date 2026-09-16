import { z } from 'zod';

export const attendanceSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(100, { message: 'Name must be less than 100 characters.' })
    .trim(),
  office_agency: z
    .string()
    .min(2, { message: 'Office/Service/Division/Unit is required.' })
    .max(150, { message: 'Office/Unit must be less than 150 characters.' })
    .trim(),
  position: z.string().max(100).optional().nullable().transform((v) => v?.trim() || null),
  sex: z.enum(['M', 'F']).optional().nullable(),
  email: z
    .string()
    .email({ message: 'Invalid email address.' })
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((v) => v?.trim() || null),
  contact_no: z.string().max(30).optional().nullable().transform((v) => v?.trim() || null),
  remarks: z.string().max(300).optional().nullable().transform((v) => v?.trim() || null),
  am_in: z.string().max(20).optional().nullable().transform((v) => v?.trim() || null),
  am_out: z.string().max(20).optional().nullable().transform((v) => v?.trim() || null),
  pm_in: z.string().max(20).optional().nullable().transform((v) => v?.trim() || null),
  pm_out: z.string().max(20).optional().nullable().transform((v) => v?.trim() || null),
  event_date: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

