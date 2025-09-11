import {z} from 'zod';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const rejectInspectionInputSchema = z.object({
    note: z.string().nullish(),
    finishedById: entityId(UserId),
});

export class RejectInspectionInputDto extends createZodDto(rejectInspectionInputSchema) {}

export const rejectInspectionDtoSchema = rejectInspectionInputSchema.extend({
    roomId: entityId(RoomId),
});

export type RejectInspectionDto = z.infer<typeof rejectInspectionDtoSchema>;
