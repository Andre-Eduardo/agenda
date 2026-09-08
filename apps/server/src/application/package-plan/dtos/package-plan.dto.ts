import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import {AppointmentType} from '@domain/appointment/entities';
import type {PackagePlan} from '@domain/package-plan/entities';

@ApiSchema({name: 'PackagePlan'})
export class PackagePlanDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty() name: string;
    @ApiProperty({nullable: true}) description: string | null;
    @ApiProperty() totalCredits: number;
    @ApiProperty() priceBrl: number;
    @ApiProperty({nullable: true}) validityDays: number | null;
    @ApiProperty({enum: AppointmentType, nullable: true}) appointmentType: AppointmentType | null;
    @ApiProperty() isActive: boolean;

    constructor(plan: PackagePlan) {
        super(plan);
        this.clinicId = plan.clinicId.toString();
        this.name = plan.name;
        this.description = plan.description;
        this.totalCredits = plan.totalCredits;
        this.priceBrl = plan.priceBrl;
        this.validityDays = plan.validityDays;
        this.appointmentType = plan.appointmentType;
        this.isActive = plan.isActive;
    }
}
