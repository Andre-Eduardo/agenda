import {z} from 'zod';
import {RecordId} from '../../../domain/record/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const signRecordSchema = z.object({
    id: entityId(RecordId),
});

export class SignRecordDto extends createZodDto(signRecordSchema) {}
