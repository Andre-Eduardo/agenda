import type {z} from 'zod';
import {RoomId} from '../../../domain/room/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {createRoomSchema} from './create-room.dto';

const updateRoomInputSchema = createRoomSchema.partial();

export class UpdateRoomInputDto extends createZodDto(updateRoomInputSchema) {}

export const updateRoomSchema = updateRoomInputSchema.extend({
    id: entityId(RoomId),
});

export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
