import {z} from 'zod';
import {RoomId} from '../../../domain/room/entities';
import {RoomState} from '../../../domain/room/models/room-state';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const finishAuditInputSchema = z.object({
    note: z.string().min(1).nullish(),
    nextRoomState: z.enum([RoomState.DIRTY, RoomState.VACANT, RoomState.BLOCKED]),
});

export class FinishAuditInputDto extends createZodDto(finishAuditInputSchema) {}

export const finishAuditDtoSchema = finishAuditInputSchema.extend({
    roomId: entityId(RoomId),
});
export type FinishAuditDto = z.infer<typeof finishAuditDtoSchema>;
