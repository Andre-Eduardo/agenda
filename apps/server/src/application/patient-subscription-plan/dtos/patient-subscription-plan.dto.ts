import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {PatientSubscriptionPlan} from '@domain/patient-subscription-plan/entities';

@ApiSchema({name: 'PatientSubscriptionPlan'})
export class PatientSubscriptionPlanDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty() name: string;
    @ApiProperty({type: 'string', nullable: true}) description: string | null;
    @ApiProperty({type: 'number'}) monthlyAppointmentQuota: number;
    @ApiProperty({type: 'number'}) priceBrl: number;
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
