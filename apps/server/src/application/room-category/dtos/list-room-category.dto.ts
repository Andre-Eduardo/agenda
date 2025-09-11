import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import type {RoomCategorySortOptions} from '../../../domain/room-category/room-category.repository';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId, pagination} from '../../@shared/validation/schemas';

const listRoomCategorySchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().optional().openapi({description: 'The name to search for'}),
    acronym: z.string().optional().openapi({description: 'The acronym to search for'}),
    pagination: pagination(<RoomCategorySortOptions>['name', 'acronym', 'createdAt', 'updatedAt']),
});

export class ListRoomCategoryDto extends createZodDto(listRoomCategorySchema) {}
