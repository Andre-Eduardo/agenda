import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AppointmentPaymentStatus, PaymentMethod} from '../../../domain/appointment-payment/entities';
import type {AppointmentPayment} from '../../../domain/appointment-payment/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'AppointmentPayment'})
export class AppointmentPaymentDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({format: 'uuid'})
    appointmentId: string;

    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid'})
    registeredByMemberId: string;

    @ApiProperty({enum: PaymentMethod})
    paymentMethod: PaymentMethod;

    @ApiProperty({enum: AppointmentPaymentStatus, enumName: 'AppointmentPaymentStatus'})
    status: AppointmentPaymentStatus;

    @ApiProperty()
    amountBrl: number;

    @ApiProperty({format: 'date-time', nullable: true})
    paidAt: string | null;

    @ApiProperty({format: 'uuid', nullable: true})
    insurancePlanId: string | null;

    @ApiProperty({nullable: true})
    insuranceAuthCode: string | null;

    @ApiProperty({nullable: true})
    notes: string | null;

    constructor(payment: AppointmentPayment) {
        super(payment);
        this.clinicId = payment.clinicId.toString();
        this.appointmentId = payment.appointmentId.toString();
        this.patientId = payment.patientId.toString();
        this.registeredByMemberId = payment.registeredByMemberId.toString();
        this.paymentMethod = payment.paymentMethod;
        this.status = payment.status;
        this.amountBrl = payment.amountBrl;
        this.paidAt = payment.paidAt?.toISOString() ?? null;
        this.insurancePlanId = payment.insurancePlanId?.toString() ?? null;
        this.insuranceAuthCode = payment.insuranceAuthCode;
        this.notes = payment.notes;
    }
}
