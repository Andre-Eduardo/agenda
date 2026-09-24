import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

export const searchAuditLogsSchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export class SearchAuditLogsDto extends createZodDto(searchAuditLogsSchema) {}
