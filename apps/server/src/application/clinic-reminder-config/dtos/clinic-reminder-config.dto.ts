import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {ReminderChannel} from '../../../domain/appointment-reminder/entities';
import type {ClinicReminderConfig} from '../../../domain/clinic-reminder-config/entities';
import {EntityDto} from '../../@shared/dto';
import {createZodDto} from '../../@shared/validation/dto';

export const upsertReminderConfigSchema = z.object({
    enabledChannels: z.array(z.nativeEnum(ReminderChannel)).min(1),
    hoursBeforeList: z.array(z.number().int().positive()).min(1),
    isActive: z.boolean().optional(),
});

export class UpsertReminderConfigDto extends createZodDto(upsertReminderConfigSchema) {}

@ApiSchema({name: 'ClinicReminderConfig'})
export class ClinicReminderConfigDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({enum: ReminderChannel, isArray: true})
    enabledChannels: ReminderChannel[];

    @ApiProperty({type: [Number]})
    hoursBeforeList: number[];

    @ApiProperty()
    isActive: boolean;

    constructor(config: ClinicReminderConfig) {
        super(config);
        this.clinicId = config.clinicId.toString();
        this.enabledChannels = config.enabledChannels;
        this.hoursBeforeList = config.hoursBeforeList;
        this.isActive = config.isActive;
    }
}
