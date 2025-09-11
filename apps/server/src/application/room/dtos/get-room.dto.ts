import {z} from 'zod';
import {RoomId} from '../../../domain/room/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getRoomSchema = z.object({
    id: entityId(RoomId),
});

export class GetRoomDto extends createZodDto(getRoomSchema) {}
