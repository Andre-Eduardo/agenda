import {z} from 'zod';
import {Gender} from '../../../domain/person/entities';
import {PatientId} from '../../../domain/patient/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId, phone} from '../../@shared/validation/schemas';

const updateAddressSchema = z.object({
    street: z.string().nullish(),
    number: z.string().nullish(),
    complement: z.string().nullish(),
    neighborhood: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    zipCode: z.string().nullish(),
    country: z.string().nullish(),
});

const updatePatientInputSchema = z.object({
    name: z.string().min(1).optional().openapi({example: 'John Doe'}),
    phone: phone().nullish(),
    gender: z.nativeEnum(Gender).nullish(),
    birthDate: datetime.nullish(),
    email: z.string().email().nullish().openapi({example: 'john.doe@example.com'}),
    emergencyContactName: z.string().nullish().openapi({example: 'Jane Doe'}),
    emergencyContactPhone: z.string().nullish().openapi({example: '(12) 94567-8912'}),
    address: updateAddressSchema.nullish(),
    insurancePlanId: z.string().uuid().nullish(),
    insuranceCardNumber: z.string().nullish(),
    insuranceValidUntil: datetime.nullish(),
});

export class UpdatePatientInputDto extends createZodDto(updatePatientInputSchema) {}

export const updatePatientSchema = updatePatientInputSchema.extend({
    id: entityId(PatientId),
});

export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;
