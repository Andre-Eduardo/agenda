import {ApiProperty} from '@nestjs/swagger';
import {ApiSchema} from '@nestjs/swagger';

type PaymentEventRow = {
    id: string;
    clinicId: string;
    memberId: string;
    subscriptionId: string;
    asaasPaymentId: string | null;
    asaasSubscriptionId: string | null;
    eventType: string;
    amount: number | null;
    paymentMethod: string | null;
    status: string;
    processedAt: Date | null;
    createdAt: Date;
};

@ApiSchema({name: 'PaymentEvent'})
export class PaymentEventDto {
    @ApiProperty() id!: string;
    @ApiProperty() clinicId!: string;
    @ApiProperty() memberId!: string;
    @ApiProperty() subscriptionId!: string;
    @ApiProperty({nullable: true}) asaasPaymentId!: string | null;
    @ApiProperty({nullable: true}) asaasSubscriptionId!: string | null;
    @ApiProperty() eventType!: string;
    @ApiProperty({nullable: true}) amount!: number | null;
    @ApiProperty({nullable: true}) paymentMethod!: string | null;
    @ApiProperty() status!: string;
    @ApiProperty({nullable: true}) processedAt!: string | null;
    @ApiProperty() createdAt!: string;

    constructor(row: PaymentEventRow) {
        this.id = row.id;
        this.clinicId = row.clinicId;
        this.memberId = row.memberId;
        this.subscriptionId = row.subscriptionId;
        this.asaasPaymentId = row.asaasPaymentId;
        this.asaasSubscriptionId = row.asaasSubscriptionId;
        this.eventType = row.eventType;
        this.amount = row.amount;
        this.paymentMethod = row.paymentMethod;
        this.status = row.status;
        this.processedAt = row.processedAt?.toISOString() ?? null;
        this.createdAt = row.createdAt.toISOString();
    }
}
