import {z} from 'zod';
import {DeepCleaningEndReasonType} from '../../../domain/deep-cleaning/entities';
import {RoomId} from '../../../domain/room/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

const finishDeepCleaningInputSchema = z.object({
    endReason: z.enum([DeepCleaningEndReasonType.FINISHED, DeepCleaningEndReasonType.CANCELED]),
});

export class FinishDeepCleaningInputDto extends createZodDto(finishDeepCleaningInputSchema) {}

export const finishDeepCleaningSchema = finishDeepCleaningInputSchema.extend({
    roomId: entityId(RoomId),
});

export type FinishDeepCleaningDto = z.infer<typeof finishDeepCleaningSchema>;
