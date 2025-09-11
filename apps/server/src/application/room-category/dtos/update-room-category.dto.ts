import type {z} from 'zod';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createRoomCategorySchema} from './create-room-category.dto';

const updateRoomCategoryInputSchema = createRoomCategorySchema.omit({companyId: true}).partial();

export class UpdateRoomCategoryInputDto extends createZodDto(updateRoomCategoryInputSchema) {}

export const updateRoomCategorySchema = updateRoomCategoryInputSchema.extend({
    id: entityId(RoomCategoryId),
});

export type UpdateRoomCategoryDto = z.infer<typeof updateRoomCategorySchema>;
