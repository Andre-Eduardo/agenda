import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {InsurancePlan} from '../../../domain/insurance-plan/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'InsurancePlan'})
export class InsurancePlanDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'Clinic this plan belongs to'})
    clinicId: string;

    @ApiProperty({description: 'Plan name', example: 'Unimed'})
    name: string;

    @ApiProperty({nullable: true, description: 'Internal or TISS code', example: 'UNI-001'})
    code: string | null;

    @ApiProperty({description: 'Whether the plan is active'})
    isActive: boolean;

    constructor(plan: InsurancePlan) {
        super(plan);
        this.clinicId = plan.clinicId.toString();
        this.name = plan.name;
        this.code = plan.code;
        this.isActive = plan.isActive;
    }
}
