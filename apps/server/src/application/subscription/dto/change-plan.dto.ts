import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {PlanCodeRecord} from '../subscription-plans.config';

export const changePlanSchema = z.object({
    planCode: z.nativeEnum(PlanCodeRecord).openapi({example: 'CONSULTORIO'}),
});

export class ChangePlanDto extends createZodDto(changePlanSchema) {}
