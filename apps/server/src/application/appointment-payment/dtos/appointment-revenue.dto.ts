import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {AppointmentRevenue} from '@domain/appointment-payment/appointment-revenue';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';

@ApiSchema({name: 'AppointmentRevenue'})
export class AppointmentRevenueDto {
    @ApiProperty()
    expectedBrl: number;

    @ApiProperty()
    receivedBrl: number;

    @ApiProperty()
    pendingBrl: number;

    @ApiProperty({enum: PaymentMethod, nullable: true})
    paymentMethod: PaymentMethod | null;

    @ApiProperty({enum: AppointmentPaymentStatus, enumName: 'AppointmentPaymentStatus'})
    status: AppointmentPaymentStatus;

    @ApiProperty({type: String, format: 'date-time', nullable: true})
    paidAt: string | null;

    @ApiProperty({enum: InsuranceClaimStatus, nullable: true})
    insuranceClaimStatus: InsuranceClaimStatus | null;

    constructor(revenue: AppointmentRevenue) {
        this.expectedBrl = revenue.expectedBrl;
        this.receivedBrl = revenue.receivedBrl;
        this.pendingBrl = revenue.pendingBrl;
        this.paymentMethod = revenue.paymentMethod;
        this.status = revenue.status;
        this.paidAt = revenue.paidAt?.toISOString() ?? null;
        this.insuranceClaimStatus = revenue.insuranceClaimStatus;
    }
}
