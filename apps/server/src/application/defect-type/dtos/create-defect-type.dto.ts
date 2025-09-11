import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createDefectTypeSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).openapi({example: 'Automation'}),
});

export class CreateDefectTypeDto extends createZodDto(createDefectTypeSchema) {}
