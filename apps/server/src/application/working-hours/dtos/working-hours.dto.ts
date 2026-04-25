import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {WorkingHours} from '../../../domain/professional/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'WorkingHours'})
export class WorkingHoursDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The clinic member this schedule belongs to'})
    clinicMemberId: string;

    @ApiProperty({description: 'Day of week (0 = Sunday, 6 = Saturday)'})
    dayOfWeek: number;

    @ApiProperty({description: 'Start time in HH:MM format', example: '08:00'})
    startTime: string;

    @ApiProperty({description: 'End time in HH:MM format', example: '17:00'})
    endTime: string;

    @ApiProperty({description: 'Appointment slot duration in minutes'})
    slotDuration: number;

    @ApiProperty({description: 'Whether this schedule is active'})
    active: boolean;

    constructor(workingHours: WorkingHours) {
        super(workingHours);
        this.clinicMemberId = workingHours.clinicMemberId.toString();
        this.dayOfWeek = workingHours.dayOfWeek;
        this.startTime = workingHours.startTime;
        this.endTime = workingHours.endTime;
        this.slotDuration = workingHours.slotDuration;
        this.active = workingHours.active;
    }
}
