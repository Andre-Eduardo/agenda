import {z} from 'zod';
import {StockId} from '../../../domain/stock/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteStockSchema = z.object({
    id: entityId(StockId),
});

export class DeleteStockDto extends createZodDto(deleteStockSchema) {}
