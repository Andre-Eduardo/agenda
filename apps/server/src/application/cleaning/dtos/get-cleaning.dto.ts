import {z} from 'zod';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const getCleaningSchema = z.object({
    id: entityId(RoomStatusId),
});

export class GetCleaningDto extends createZodDto(getCleaningSchema) {}
