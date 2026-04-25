import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';

export const upsertWorkingHoursSchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    slotDuration: z.number().int().min(5).max(120),
    active: z.boolean().default(true),
});

export class UpsertWorkingHoursDto extends createZodDto(upsertWorkingHoursSchema) {}
