import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {PatientSubscriptionPlan} from '@domain/patient-subscription-plan/entities';

@ApiSchema({name: 'PatientSubscriptionPlan'})
export class PatientSubscriptionPlanDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty() name: string;
    @ApiProperty({nullable: true}) description: string | null;
    @ApiProperty() monthlyAppointmentQuota: number;
    @ApiProperty() priceBrl: number;
    @ApiProperty() isActive: boolean;

    constructor(plan: PatientSubscriptionPlan) {
        super(plan);
        this.clinicId = plan.clinicId.toString();
        this.name = plan.name;
        this.description = plan.description;
        this.monthlyAppointmentQuota = plan.monthlyAppointmentQuota;
        this.priceBrl = plan.priceBrl;
        this.isActive = plan.isActive;
    }
}
