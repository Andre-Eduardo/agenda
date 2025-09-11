import type {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createCompanySchema} from './create-company.dto';

const updateCompanyInputSchema = createCompanySchema.partial();

export class UpdateCompanyInputDto extends createZodDto(updateCompanyInputSchema) {}

export const updateCompanySchema = updateCompanyInputSchema.extend({
    id: entityId(CompanyId),
});

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
