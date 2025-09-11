import {z} from 'zod';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const deleteRoomCategorySchema = z.object({
    id: entityId(RoomCategoryId),
});

export class DeleteRoomCategoryDto extends createZodDto(deleteRoomCategorySchema) {}
