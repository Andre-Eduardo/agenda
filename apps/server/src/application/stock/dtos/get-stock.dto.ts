import {z} from 'zod';
import {StockId} from '../../../domain/stock/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getStockSchema = z.object({
    id: entityId(StockId),
});

export class GetStockDto extends createZodDto(getStockSchema) {}
