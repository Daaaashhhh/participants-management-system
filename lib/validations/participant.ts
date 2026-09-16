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
      })
    )
    .min(1, { message: 'Please provide at least one valid participant name.' }),
});

export type BatchParticipantFormValues = z.infer<typeof batchParticipantSchema>;

