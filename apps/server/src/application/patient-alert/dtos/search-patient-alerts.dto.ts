import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {PatientAlertId} from '../../../domain/patient-alert/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

export const searchPatientAlertsSchema = pagination(['createdAt', 'updatedAt', 'severity'] as const).extend({
    isActive: z
        .string()
        .transform((v) => v === 'true')
        .optional()
        .openapi({description: 'Filter by active status (true/false)'}),
});

export class SearchPatientAlertsDto extends createZodDto(searchPatientAlertsSchema) {}

export const patientAlertParamsSchema = z.object({
    patientId: entityId(PatientId),
    alertId: entityId(PatientAlertId),
});

export const patientAlertPatientParamSchema = z.object({
    patientId: entityId(PatientId),
});

export type SearchPatientAlertsQueryDto = z.infer<typeof searchPatientAlertsSchema>;
