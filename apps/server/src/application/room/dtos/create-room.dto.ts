import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createRoomSchema = z.object({
    companyId: entityId(CompanyId),
    categoryId: entityId(RoomCategoryId),
    number: z.number().int().positive().openapi({example: 1}),
    name: z.string().min(1).nullish().openapi({example: 'Premium'}),
});

export class CreateRoomDto extends createZodDto(createRoomSchema) {}
