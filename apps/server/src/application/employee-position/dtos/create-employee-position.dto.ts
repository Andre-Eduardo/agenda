import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, permissions} from '../../@shared/validation/schemas';

export const createEmployeePositionSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).openapi({example: 'Manager'}),
    permissions,
});

export class CreateEmployeePositionDto extends createZodDto(createEmployeePositionSchema) {}
