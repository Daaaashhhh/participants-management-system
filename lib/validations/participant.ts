import { z } from 'zod';

export const participantStatusSchema = z.enum(['Pending', 'Confirmed', 'Cancelled']);

export const participantSchema = z.object({
  partner_agency_id: z
    .string()
    .min(1, { message: 'Please select a Partner Agency.' }),
  cbo_id: z
    .string()
    .min(1, { message: 'Please select a CBO belonging to the selected Partner Agency.' }),
  name: z
    .string()
    .min(2, { message: 'Participant name must be at least 2 characters.' })
    .max(100, { message: 'Participant name must be less than 100 characters.' })
    .trim(),
  status: participantStatusSchema.default('Pending'),
});

export type ParticipantFormValues = z.infer<typeof participantSchema>;

/** Optional attendance fields that can be filled in when enrolling a participant */
const attendanceFieldsSchema = z.object({
  position: z.string().max(100).trim().optional(),
  sex: z.enum(['M', 'F']).optional().nullable(),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  contact_no: z.string().max(30).trim().optional(),
  remarks: z.string().max(255).trim().optional(),
  am_in: z.string().max(20).trim().optional(),
  am_out: z.string().max(20).trim().optional(),
  pm_in: z.string().max(20).trim().optional(),
  pm_out: z.string().max(20).trim().optional(),
});

export type AttendanceFields = z.infer<typeof attendanceFieldsSchema>;

export const batchParticipantSchema = z.object({
  partner_agency_id: z
    .string()
    .min(1, { message: 'Please select a Partner Agency.' }),
  cbo_id: z
    .string()
    .min(1, { message: 'Please select a CBO belonging to the selected Partner Agency.' }),
  participants: z
    .array(
      z.object({
        name: z
          .string()
          .min(2, { message: 'Participant name must be at least 2 characters.' })
          .max(100, { message: 'Participant name must be less than 100 characters.' })
          .trim(),
        status: participantStatusSchema.default('Pending'),
      }).merge(attendanceFieldsSchema)
    )
    .min(1, { message: 'Please provide at least one valid participant name.' }),
});

export type BatchParticipantFormValues = z.infer<typeof batchParticipantSchema>;
