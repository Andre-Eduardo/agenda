import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {pagination} from '@application/@shared/validation/schemas';
import {ClinicAccountType} from '@domain/clinic/entities';

export const searchClinicsSchema = pagination(['name', 'createdAt'] as const).extend({
    term: z.string().optional().openapi({description: 'Search term to filter by clinic name'}),
    accountType: z.nativeEnum(ClinicAccountType).optional().openapi({description: 'Only solo or only clinic accounts'}),
});

export class SearchClinicsDto extends createZodDto(searchClinicsSchema) {}
