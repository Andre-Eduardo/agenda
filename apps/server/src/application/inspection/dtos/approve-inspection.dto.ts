import {z} from 'zod';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const approveInspectionInputSchema = z.object({
    note: z.string().nullish(),
    finishedById: entityId(UserId),
});

export class ApproveInspectionInputDto extends createZodDto(approveInspectionInputSchema) {}

export const approveInspectionDtoSchema = approveInspectionInputSchema.extend({
    roomId: entityId(RoomId),
});

export type ApproveInspectionDto = z.infer<typeof approveInspectionDtoSchema>;
