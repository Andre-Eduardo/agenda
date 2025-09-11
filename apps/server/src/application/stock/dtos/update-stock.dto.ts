import type {z} from 'zod';
import {StockId} from '../../../domain/stock/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createStockSchema} from './create-stock.dto';

const updateStockInputSchema = createStockSchema.pick({name: true}).partial();

export class UpdateStockInputDto extends createZodDto(updateStockInputSchema) {}

export const updateStockSchema = updateStockInputSchema.extend({
    id: entityId(StockId),
});

export type UpdateStockDto = z.infer<typeof updateStockSchema>;
