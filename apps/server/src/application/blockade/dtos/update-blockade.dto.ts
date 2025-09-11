import type {z} from 'zod';
import {RoomStatusId} from '../../../domain/room-status/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {startBlockadeSchema} from './start-blockade.dto';

const updateBlockadeInputSchema = startBlockadeSchema.omit({companyId: true, roomId: true}).partial();

export class UpdateBlockadeInputDto extends createZodDto(updateBlockadeInputSchema) {}

export const updateBlockadeSchema = updateBlockadeInputSchema.extend({
    id: entityId(RoomStatusId),
});

export type UpdateBlockadeDto = z.infer<typeof updateBlockadeSchema>;
