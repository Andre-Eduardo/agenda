import {Injectable, Logger} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {randomUUID} from 'crypto';
import {toEnum} from '../../../domain/@shared/utils';
import {PrismaProvider} from '../../../infrastructure/repository/prisma/prisma.provider';
import {PaymentService} from '../payment.service';

type AsaasWebhookPayload = {
    event: string;
    payment?: {
        id: string;
        subscription?: string;
        customer: string;
        value: number;
        billingType: string;
        status: string;
        dateCreated: string;
        dueDate: string;
        paymentDate?: string;
    };
};

const EVENT_TO_STATUS: Record<string, string> = {
    PAYMENT_CONFIRMED: 'CONFIRMED',
    PAYMENT_RECEIVED: 'RECEIVED',
    PAYMENT_OVERDUE: 'OVERDUE',
    PAYMENT_DELETED: 'FAILED',
    PAYMENT_REFUNDED: 'REFUNDED',
};

const OVERDUE_SUSPENSION_DAYS = 3;

@Injectable()
export class AsaasWebhookService {
    private readonly logger = new Logger(AsaasWebhookService.name);

    constructor(
        private readonly prismaProvider: PrismaProvider,
        private readonly paymentService: PaymentService,
    ) {}

    private get prisma() {
        return this.prismaProvider.client;
    }

    async handleWebhook(rawPayload: unknown): Promise<void> {
        const payload = rawPayload as AsaasWebhookPayload;
        const {event, payment} = payload;

        if (!payment) {
            this.logger.log(`Skipping Asaas event without payment: ${event}`);
            return;
        }

        const asaasPaymentId = payment.id;
        const asaasSubscriptionId = payment.subscription ?? null;

        const subscription = asaasSubscriptionId
            ? await this.prisma.professionalSubscription.findFirst({
                  where: {asaasSubscriptionId},
              })
            : null;

        if (!subscription) {
            this.logger.warn(
                `No subscription found for asaasSubscriptionId=${asaasSubscriptionId ?? 'none'}`,
            );
            return;
        }

        if (asaasPaymentId) {
            const existing = await this.prisma.paymentEvent.findFirst({
                where: {asaasPaymentId, eventType: event},
            });
            if (existing) {
                this.logger.log(`Duplicate webhook skipped: paymentId=${asaasPaymentId} event=${event}`);
                return;
            }
        }

        const rawStatus = EVENT_TO_STATUS[event] ?? 'PENDING';
        const status = toEnum(PrismaClient.PaymentStatus, rawStatus);
        const now = new Date();

        const eventId = randomUUID();
        await this.prisma.paymentEvent.create({
            data: {
                id: eventId,
                clinicId: subscription.clinicId,
                memberId: subscription.memberId,
                subscriptionId: subscription.id,
                asaasPaymentId: asaasPaymentId ?? null,
                asaasSubscriptionId,
                eventType: event,
                amount: payment.value,
                paymentMethod: payment.billingType,
                status,
                rawPayload: rawPayload as PrismaClient.Prisma.JsonObject,
                processedAt: null,
                createdAt: now,
            },
        });

        try {
            await this.processEvent(
                event,
                subscription.memberId,
                subscription.clinicId,
                subscription.id,
                payment,
                now,
            );

            await this.prisma.paymentEvent.update({
                where: {id: eventId},
                data: {processedAt: new Date()},
            });
        } catch (err) {
            this.logger.error(`Failed to process Asaas event ${event}: ${String(err)}`);
        }
    }

    private async processEvent(
        event: string,
        memberId: string,
        clinicId: string,
        subscriptionId: string,
        payment: NonNullable<AsaasWebhookPayload['payment']>,
        now: Date,
    ): Promise<void> {
        switch (event) {
            case 'PAYMENT_CONFIRMED':
            case 'PAYMENT_RECEIVED': {
                const paymentStatus = toEnum(
                    PrismaClient.PaymentStatus,
                    event === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : 'RECEIVED',
                );
                await this.prisma.professionalSubscription.update({
                    where: {memberId},
                    data: {
                        lastPaymentStatus: paymentStatus,
                        lastPaymentAt: now,
                        status: 'ACTIVE',
                        updatedAt: now,
                    },
                });
                await this.paymentService.createUsageRecordForNextPeriodIfNeeded(
                    subscriptionId,
                    memberId,
                    clinicId,
                );
                break;
            }

            case 'PAYMENT_OVERDUE': {
                const dueDate = new Date(payment.dueDate);
                const daysPastDue = Math.floor(
                    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
                );
                const suspended = daysPastDue >= OVERDUE_SUSPENSION_DAYS;

                await this.prisma.professionalSubscription.update({
                    where: {memberId},
                    data: {
                        lastPaymentStatus: 'OVERDUE',
                        lastPaymentAt: now,
                        ...(suspended ? {status: 'SUSPENDED'} : {}),
                        updatedAt: now,
                    },
                });

                if (suspended) {
                    this.logger.warn(
                        `Subscription suspended for member ${memberId} — overdue ${daysPastDue} days`,
                    );
                }
                break;
            }

            case 'PAYMENT_DELETED': {
                await this.prisma.professionalSubscription.update({
                    where: {memberId},
                    data: {lastPaymentStatus: 'FAILED', lastPaymentAt: now, updatedAt: now},
                });
                break;
            }

            case 'PAYMENT_REFUNDED': {
                await this.prisma.professionalSubscription.update({
                    where: {memberId},
                    data: {lastPaymentStatus: 'REFUNDED', lastPaymentAt: now, updatedAt: now},
                });
                break;
            }

            default:
                this.logger.log(`Unhandled Asaas event type: ${event}`);
        }
    }
}
