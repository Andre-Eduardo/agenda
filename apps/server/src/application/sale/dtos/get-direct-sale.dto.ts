import {z} from 'zod';
import {SaleId} from '../../../domain/sale/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getDirectSaleSchema = z.object({
    id: entityId(SaleId),
});

export class GetDirectSaleDto extends createZodDto(getDirectSaleSchema) {}
