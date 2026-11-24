import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {ModuleType} from '@domain/clinic-license/models';
import type {ClinicId} from '@domain/clinic/entities';

const seatCount = z.number().int().min(0);

export const configureClinicLicenseSchema = z.object({
    includedProfessionals: seatCount,
    /** null = sem teto. */
    maxProfessionals: seatCount.nullable(),
    modules: z
        .array(
            z.object({
                type: z.nativeEnum(ModuleType),
                includedSeats: seatCount,
                maxSeats: seatCount.nullable(),
            })
        )
        .refine((modules) => new Set(modules.map((module) => module.type)).size === modules.length, {
            message: 'Each module can be listed only once.',
        }),
});

export class ConfigureClinicLicenseInputDto extends createZodDto(configureClinicLicenseSchema) {}

export type ConfigureClinicLicenseDto = ConfigureClinicLicenseInputDto & {clinicId: ClinicId};
