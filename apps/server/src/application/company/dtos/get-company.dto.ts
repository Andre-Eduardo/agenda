import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getCompanySchema = z.object({
    id: entityId(CompanyId),
});

export class GetCompanyDto extends createZodDto(getCompanySchema) {}
