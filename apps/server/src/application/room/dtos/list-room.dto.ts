import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {RoomSortOptions} from '../../../domain/room/room.repository';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listRoomSchema = z.object({
    companyId: entityId(CompanyId),
    categoryId: entityId(RoomCategoryId).optional().openapi({description: 'The category to search for'}),
    number: z.number().optional().openapi({description: 'The number to search for'}),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    pagination: pagination(<RoomSortOptions>['name', 'number', 'createdAt', 'updatedAt']),
});

export class ListRoomDto extends createZodDto(listRoomSchema) {}
