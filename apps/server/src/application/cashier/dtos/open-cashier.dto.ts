import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const openCashierSchema = z.object({
    companyId: entityId(CompanyId),
    userId: entityId(UserId),
});

export class OpenCashierDto extends createZodDto(openCashierSchema) {}
