import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {COMMUNICATION_PREFERENCE_REASON_MAX_LENGTH} from '@domain/patient-communication-preference/entities';
import {PatientId} from '@domain/patient/entities';

const updatePatientCommunicationPreferenceInputSchema = z.object({
    channel: z.nativeEnum(ReminderChannel),
    optedOut: z.boolean().openapi({description: 'true = the patient refuses this channel'}),
    reason: z
        .string()
        .max(COMMUNICATION_PREFERENCE_REASON_MAX_LENGTH)
        .nullish()
        .openapi({example: 'Paciente pediu por telefone para não receber lembretes por WhatsApp'}),
});

export class UpdatePatientCommunicationPreferenceInputDto extends createZodDto(
    updatePatientCommunicationPreferenceInputSchema
) {}

export const updatePatientCommunicationPreferenceSchema = updatePatientCommunicationPreferenceInputSchema.extend({
    patientId: entityId(PatientId),
});

export type UpdatePatientCommunicationPreferenceDto = z.infer<typeof updatePatientCommunicationPreferenceSchema>;

export const patientCommunicationPreferenceParamSchema = z.object({
    patientId: entityId(PatientId),
});

export type GetPatientCommunicationPreferencesDto = z.infer<typeof patientCommunicationPreferenceParamSchema>;
