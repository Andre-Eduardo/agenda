import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import type {PatientPackage} from '@domain/patient-package/entities';
import {PatientPackageStatus} from '@domain/patient-package/entities';

@ApiSchema({name: 'PatientPackage'})
export class PatientPackageDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty({format: 'uuid'}) patientId: string;
    @ApiProperty({format: 'uuid'}) packagePlanId: string;
    @ApiProperty() planNameSnapshot: string;
    @ApiProperty() totalCredits: number;
    @ApiProperty() priceBrl: number;
    @ApiProperty() remainingCredits: number;
    @ApiProperty({enum: PatientPackageStatus}) status: PatientPackageStatus;
    @ApiProperty({type: 'string', format: 'date-time'}) purchasedAt: string;
    @ApiProperty({type: 'string', format: 'date-time', nullable: true}) expiresAt: string | null;
    @ApiProperty({enum: PaymentMethod}) paymentMethod: PaymentMethod;
    @ApiProperty({type: 'string', format: 'date-time', nullable: true}) paidAt: string | null;
    @ApiProperty({format: 'uuid'}) soldByMemberId: string;

    constructor(patientPackage: PatientPackage) {
        super(patientPackage);
        this.clinicId = patientPackage.clinicId.toString();
        this.patientId = patientPackage.patientId.toString();
        this.packagePlanId = patientPackage.packagePlanId.toString();
        this.planNameSnapshot = patientPackage.planNameSnapshot;
        this.totalCredits = patientPackage.totalCredits;
        this.priceBrl = patientPackage.priceBrl;
        this.remainingCredits = patientPackage.remainingCredits;
        this.status = patientPackage.status;
        this.purchasedAt = patientPackage.purchasedAt.toJSON();
        this.expiresAt = patientPackage.expiresAt?.toJSON() ?? null;
        this.paymentMethod = patientPackage.paymentMethod;
        this.paidAt = patientPackage.paidAt?.toJSON() ?? null;
        this.soldByMemberId = patientPackage.soldByMemberId.toString();
    }
}
