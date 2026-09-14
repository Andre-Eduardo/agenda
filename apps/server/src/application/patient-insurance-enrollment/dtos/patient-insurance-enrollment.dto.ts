import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {PatientInsuranceEnrollment} from '@domain/patient-insurance-enrollment/entities';
import {PatientInsuranceEnrollmentStatus} from '@domain/patient-insurance-enrollment/entities';

@ApiSchema({name: 'PatientInsuranceEnrollment'})
export class PatientInsuranceEnrollmentDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The clinic this enrollment belongs to'})
    clinicId: string;

    @ApiProperty({format: 'uuid', description: 'The patient ID'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'The insurance plan ID'})
    insurancePlanId: string;

    @ApiProperty({type: 'string', nullable: true, description: 'Insurance card number'})
    cardNumber: string | null;

    @ApiProperty({type: 'string', format: 'date-time', nullable: true})
    validFrom: string | null;

    @ApiProperty({type: 'string', format: 'date-time', nullable: true})
    validUntil: string | null;

    @ApiProperty({description: 'Whether this is the patient primary insurance'})
    isPrimary: boolean;

    @ApiProperty({enum: PatientInsuranceEnrollmentStatus})
    status: PatientInsuranceEnrollmentStatus;

    constructor(enrollment: PatientInsuranceEnrollment) {
        super(enrollment);
        this.clinicId = enrollment.clinicId.toString();
        this.patientId = enrollment.patientId.toString();
        this.insurancePlanId = enrollment.insurancePlanId.toString();
        this.cardNumber = enrollment.cardNumber;
        this.validFrom = enrollment.validFrom?.toJSON() ?? null;
        this.validUntil = enrollment.validUntil?.toJSON() ?? null;
        this.isPrimary = enrollment.isPrimary;
        this.status = enrollment.status;
    }
}
