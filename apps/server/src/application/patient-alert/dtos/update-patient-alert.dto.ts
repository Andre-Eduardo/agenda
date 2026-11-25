import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientAlertId, AlertSeverity} from '@domain/patient-alert/entities';
import {PatientId} from '@domain/patient/entities';

const updatePatientAlertInputSchema = z
    .object({
        title: z.string().min(1).max(255).optional().openapi({example: 'Updated alert title'}),
        description: z.string().nullish().openapi({example: 'Updated description'}),
        severity: z.nativeEnum(AlertSeverity).optional(),
        isActive: z.boolean().optional(),
    })
    .openapi({required: []});

export class UpdatePatientAlertInputDto extends createZodDto(updatePatientAlertInputSchema) {}

export const updatePatientAlertSchema = updatePatientAlertInputSchema.extend({
    alertId: entityId(PatientAlertId),
    patientId: entityId(PatientId),
});

export type UpdatePatientAlertDto = z.infer<typeof updatePatientAlertSchema>;
