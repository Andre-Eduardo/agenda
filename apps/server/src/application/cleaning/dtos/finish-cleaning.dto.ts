import {z} from 'zod';
import {CleaningEndReasonType} from '../../../domain/cleaning/entities';
import {RoomId} from '../../../domain/room/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const finishCleaningInputSchema = z.object({
    endReason: z.enum([CleaningEndReasonType.FINISHED, CleaningEndReasonType.CANCELED]),
});

export class FinishCleaningInputDto extends createZodDto(finishCleaningInputSchema) {}

export const finishCleaningSchema = finishCleaningInputSchema.extend({
    roomId: entityId(RoomId),
});

export type FinishCleaningDto = z.infer<typeof finishCleaningSchema>;
