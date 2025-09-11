import {z} from 'zod';
import {CashierId} from '../../../domain/cashier/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getCashierSchema = z.object({
    id: entityId(CashierId),
});

export class GetCashierDto extends createZodDto(getCashierSchema) {}
