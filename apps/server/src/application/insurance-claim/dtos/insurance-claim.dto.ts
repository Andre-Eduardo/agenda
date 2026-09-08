import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {InsuranceClaim} from '@domain/insurance-claim/entities';
import {InsuranceAuthorizationStatus, InsuranceClaimStatus} from '@domain/insurance-claim/entities';

@ApiSchema({name: 'InsuranceClaim'})
export class InsuranceClaimDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty({format: 'uuid'}) appointmentPaymentId: string;
    @ApiProperty({format: 'uuid'}) patientInsuranceEnrollmentId: string;
    @ApiProperty({format: 'uuid'}) insurancePlanId: string;
    @ApiProperty({nullable: true}) authorizationCode: string | null;
    @ApiProperty({enum: InsuranceAuthorizationStatus}) authorizationStatus: InsuranceAuthorizationStatus;
    @ApiProperty({enum: InsuranceClaimStatus}) claimStatus: InsuranceClaimStatus;
    @ApiProperty() submittedAmountBrl: number;
    @ApiProperty({nullable: true}) approvedAmountBrl: number | null;
    @ApiProperty({nullable: true}) glosaReason: string | null;
    @ApiProperty({nullable: true}) glosaAmountBrl: number | null;
    @ApiProperty({type: 'string', format: 'date-time', nullable: true}) submittedAt: string | null;
    @ApiProperty({type: 'string', format: 'date-time', nullable: true}) resolvedAt: string | null;

    constructor(claim: InsuranceClaim) {
        super(claim);
        this.clinicId = claim.clinicId.toString();
        this.appointmentPaymentId = claim.appointmentPaymentId.toString();
        this.patientInsuranceEnrollmentId = claim.patientInsuranceEnrollmentId.toString();
        this.insurancePlanId = claim.insurancePlanId.toString();
        this.authorizationCode = claim.authorizationCode;
        this.authorizationStatus = claim.authorizationStatus;
        this.claimStatus = claim.claimStatus;
        this.submittedAmountBrl = claim.submittedAmountBrl;
        this.approvedAmountBrl = claim.approvedAmountBrl;
        this.glosaReason = claim.glosaReason;
        this.glosaAmountBrl = claim.glosaAmountBrl;
        this.submittedAt = claim.submittedAt?.toJSON() ?? null;
        this.resolvedAt = claim.resolvedAt?.toJSON() ?? null;
    }
}
