import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import {StockType} from '../../../domain/stock/entities';
import type {StockSortOptions} from '../../../domain/stock/stock.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listStockSchema = z.object({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).optional().openapi({description: 'The room to search for'}),
    name: z.string().min(1).optional().openapi({description: 'The name to search for', example: 'Hallway stock'}),
    type: z.nativeEnum(StockType).optional().openapi({description: 'The type to search for', enumName: 'StockType'}),
    pagination: pagination(<StockSortOptions>['name', 'type', 'createdAt', 'updatedAt']),
});

export class ListStockDto extends createZodDto(listStockSchema) {}
