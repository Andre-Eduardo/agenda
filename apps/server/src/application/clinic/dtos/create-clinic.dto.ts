import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {ClinicAccountType} from '@domain/clinic/entities';
import {AiSpecialtyGroup} from '@domain/form-template/entities';

export const createClinicSchema = z.object({
    name: z.string().min(1).max(255),
    documentId: z.string().nullish(),
    phone: z.string().nullish(),
    email: z.string().email().nullish(),
    accountType: z.nativeEnum(ClinicAccountType).optional(),
    // Obsoleto: use accountType. `true` equivale a SOLO.
    isPersonalClinic: z.boolean().optional(),
    street: z.string().nullish(),
    number: z.string().nullish(),
    complement: z.string().nullish(),
    neighborhood: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    zipCode: z.string().nullish(),
    country: z.string().nullish(),
    logoUrl: z.string().url().nullish(),
    clinicSpecialties: z.array(z.nativeEnum(AiSpecialtyGroup)).optional(),
});

export class CreateClinicDto extends createZodDto(createClinicSchema) {}
