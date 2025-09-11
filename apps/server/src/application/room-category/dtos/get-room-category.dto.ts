import {z} from 'zod';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getRoomCategorySchema = z.object({
    id: entityId(RoomCategoryId),
});

export class GetRoomCategoryDto extends createZodDto(getRoomCategorySchema) {}
