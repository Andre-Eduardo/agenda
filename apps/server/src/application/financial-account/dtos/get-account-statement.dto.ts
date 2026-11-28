import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime} from '@application/@shared/validation/schemas';

export const getAccountStatementSchema = z.object({
    from: datetime.optional().openapi({description: 'Movements from this moment (ISO 8601)'}),
    to: datetime.optional().openapi({description: 'Movements up to this moment (ISO 8601)'}),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export class GetAccountStatementDto extends createZodDto(getAccountStatementSchema) {}
