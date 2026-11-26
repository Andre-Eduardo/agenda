import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId, pagination} from '@application/@shared/validation/schemas';
import {AlertSeverity, PatientAlertId} from '@domain/patient-alert/entities';
import {PatientId} from '@domain/patient/entities';

export const searchPatientAlertsSchema = pagination(['createdAt', 'updatedAt', 'severity'] as const)
    .extend({
        page: z.coerce.number().int().positive().default(1),
        isActive: z.enum(['true', 'false']).optional(),
        severity: z.nativeEnum(AlertSeverity).optional(),
    })
    .openapi({'x-param-object': false});

export class SearchPatientAlertsDto extends createZodDto(searchPatientAlertsSchema) {}

export const patientAlertParamsSchema = z.object({
    patientId: entityId(PatientId),
    alertId: entityId(PatientAlertId),
});

export const patientAlertPatientParamSchema = z.object({
    patientId: entityId(PatientId),
});

export type SearchPatientAlertsQueryDto = z.infer<typeof searchPatientAlertsSchema>;
