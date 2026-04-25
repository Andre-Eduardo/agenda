import {z} from 'zod';
import {ClinicId} from '../../../domain/clinic/entities';
import {Gender, PersonType} from '../../../domain/person/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, documentId, entityId, phone} from '../../@shared/validation/schemas';

const addressSchema = z.object({
    street: z.string().nullish(),
    number: z.string().nullish(),
    complement: z.string().nullish(),
    neighborhood: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    zipCode: z.string().nullish(),
    country: z.string().nullish(),
});

export const createPatientSchema = z.object({
    name: z.string().min(1).openapi({example: 'John Doe'}),
    documentId,
    phone: phone().nullish(),
    gender: z.nativeEnum(Gender).nullish(),
    personType: z.nativeEnum(PersonType).optional(),
    /** Tenant boundary — injected from cookie via RequestContextMiddleware. */
    clinicId: entityId(ClinicId).nullish(),
    birthDate: datetime.nullish(),
    email: z.string().email().nullish().openapi({example: 'john.doe@example.com'}),
    emergencyContactName: z.string().nullish().openapi({example: 'Jane Doe'}),
    emergencyContactPhone: z.string().nullish().openapi({example: '(12) 94567-8912'}),
    address: addressSchema.nullish(),
    insurancePlanId: z.string().uuid().nullish(),
    insuranceCardNumber: z.string().nullish(),
    insuranceValidUntil: datetime.nullish(),
});

export class CreatePatientDto extends createZodDto(createPatientSchema) {}
