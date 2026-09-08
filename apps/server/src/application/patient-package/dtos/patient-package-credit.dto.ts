import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {PatientPackageCredit} from '@domain/patient-package/entities';
import {PatientPackageCreditEventType} from '@domain/patient-package/entities';

@ApiSchema({name: 'PatientPackageCredit'})
export class PatientPackageCreditDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty({format: 'uuid'}) patientPackageId: string;
    @ApiProperty({format: 'uuid', nullable: true}) appointmentPaymentId: string | null;
    @ApiProperty({enum: PatientPackageCreditEventType}) type: PatientPackageCreditEventType;
    @ApiProperty() delta: number;
    @ApiProperty() balanceAfter: number;
    @ApiProperty({format: 'uuid', nullable: true}) registeredByMemberId: string | null;
    @ApiProperty({nullable: true}) notes: string | null;

    constructor(credit: PatientPackageCredit) {
        super(credit);
        this.clinicId = credit.clinicId.toString();
        this.patientPackageId = credit.patientPackageId.toString();
        this.appointmentPaymentId = credit.appointmentPaymentId?.toString() ?? null;
        this.type = credit.type;
        this.delta = credit.delta;
        this.balanceAfter = credit.balanceAfter;
        this.registeredByMemberId = credit.registeredByMemberId?.toString() ?? null;
        this.notes = credit.notes;
    }
}
