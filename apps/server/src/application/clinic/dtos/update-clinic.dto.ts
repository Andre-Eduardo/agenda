import {z} from 'zod';
import {AiSpecialtyGroup} from '../../../domain/form-template/entities';
import {createZodDto} from '../../@shared/validation/dto';

export const updateClinicSchema = z.object({
    name:              z.string().min(1).max(255).optional(),
    phone:             z.string().nullish(),
    email:             z.string().email().nullish(),
    street:            z.string().nullish(),
    number:            z.string().nullish(),
    complement:        z.string().nullish(),
    neighborhood:      z.string().nullish(),
    city:              z.string().nullish(),
    state:             z.string().nullish(),
    zipCode:           z.string().nullish(),
    country:           z.string().nullish(),
    logoUrl:           z.string().url().nullish(),
    clinicSpecialties: z.array(z.nativeEnum(AiSpecialtyGroup)).optional(),
});

export class UpdateClinicDto extends createZodDto(updateClinicSchema) {}
