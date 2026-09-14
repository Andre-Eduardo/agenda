import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {PatientSubscription} from '@domain/patient-subscription/entities';
import {PatientSubscriptionStatus} from '@domain/patient-subscription/entities';

@ApiSchema({name: 'PatientSubscription'})
export class PatientSubscriptionDto extends EntityDto {
    @ApiProperty({format: 'uuid'}) clinicId: string;
    @ApiProperty({format: 'uuid'}) patientId: string;
    @ApiProperty({format: 'uuid'}) subscriptionPlanId: string;
    @ApiProperty() planNameSnapshot: string;
    @ApiProperty() monthlyQuotaSnapshot: number;
    @ApiProperty() priceBrlSnapshot: number;
    @ApiProperty({enum: PatientSubscriptionStatus}) status: PatientSubscriptionStatus;
    @ApiProperty({type: 'string', format: 'date-time'}) currentPeriodStart: string;
    @ApiProperty({type: 'string', format: 'date-time'}) currentPeriodEnd: string;
    @ApiProperty({type: 'string', format: 'date-time', nullable: true}) cancelledAt: string | null;
    @ApiProperty({type: 'string', nullable: true}) cancelReason: string | null;

    constructor(subscription: PatientSubscription) {
        super(subscription);
        this.clinicId = subscription.clinicId.toString();
        this.patientId = subscription.patientId.toString();
        this.subscriptionPlanId = subscription.subscriptionPlanId.toString();
        this.planNameSnapshot = subscription.planNameSnapshot;
        this.monthlyQuotaSnapshot = subscription.monthlyQuotaSnapshot;
        this.priceBrlSnapshot = subscription.priceBrlSnapshot;
        this.status = subscription.status;
        this.currentPeriodStart = subscription.currentPeriodStart.toJSON();
        this.currentPeriodEnd = subscription.currentPeriodEnd.toJSON();
        this.cancelledAt = subscription.cancelledAt?.toJSON() ?? null;
        this.cancelReason = subscription.cancelReason;
    }
}
