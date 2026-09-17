import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {RoomId} from '@domain/room/entities';

const updateRoomInputSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    active: z.boolean().optional(),
});

export class UpdateRoomInputDto extends createZodDto(updateRoomInputSchema) {}

export const updateRoomSchema = updateRoomInputSchema.extend({
    id: entityId(RoomId),
});

export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
