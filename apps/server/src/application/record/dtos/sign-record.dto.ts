import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {RecordId} from '@domain/record/entities';

export const signRecordSchema = z.object({
    id: entityId(RecordId),
});

export class SignRecordDto extends createZodDto(signRecordSchema) {}
