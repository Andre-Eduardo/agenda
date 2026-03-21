import {z} from 'zod';
import {RecordId} from '../../../domain/record/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const updateRecordInputSchema = z.object({
    description: z.string().min(1).optional().openapi({example: 'Updated checkup notes'}),
});

export class UpdateRecordInputDto extends createZodDto(updateRecordInputSchema) {}

export const updateRecordSchema = updateRecordInputSchema.extend({
    id: entityId(RecordId),
});

export type UpdateRecordDto = z.infer<typeof updateRecordSchema>;
