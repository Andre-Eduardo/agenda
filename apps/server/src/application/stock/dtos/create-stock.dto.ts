import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import {StockId, StockType} from '../../../domain/stock/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createStockSchema = z.object({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).nullish(),
    parentId: entityId(StockId).nullish(),
    name: z.string().min(1).nullish().openapi({example: 'Main stock'}),
    type: z.nativeEnum(StockType).openapi({enumName: 'StockType'}),
});

export class CreateStockDto extends createZodDto(createStockSchema) {}
