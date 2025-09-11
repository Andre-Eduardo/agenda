import {z} from 'zod';
import {RoomId} from '../../../domain/room/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getCleaningByRoomSchema = z.object({
    roomId: entityId(RoomId),
});

export class GetCleaningByRoomDto extends createZodDto(getCleaningByRoomSchema) {}
