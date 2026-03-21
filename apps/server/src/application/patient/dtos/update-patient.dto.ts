import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const updatePatientInputSchema = z.object({});

export class UpdatePatientInputDto extends createZodDto(updatePatientInputSchema) {}

export const updatePatientSchema = updatePatientInputSchema.extend({
    id: entityId(PatientId),
});

export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;
