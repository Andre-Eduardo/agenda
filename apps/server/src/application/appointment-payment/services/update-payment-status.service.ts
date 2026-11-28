import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentPaymentDto, UpdatePaymentStatusDto} from '@application/appointment-payment/dtos';
import {InvalidInputException, PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {centsFromBrl} from '@domain/appointment-payment/brl';
import {AppointmentPayment, AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId} from '@domain/appointment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import {EventDispatcher} from '@domain/event';
import {FinancialEntryExceptions, isLedgerPaymentMethod} from '@domain/financial-entry/entities';
import {AppointmentLedger} from '@domain/financial-entry/services';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';
import {PatientPackageCredit, PatientPackageCreditEventType} from '@domain/patient-package/entities';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {PatientSubscriptionUsageRepository} from '@domain/patient-subscription/patient-subscription-usage.repository';

export type UpdatePaymentStatusCommand = UpdatePaymentStatusDto & {appointmentId: AppointmentId};

@Injectable()
export class UpdatePaymentStatusService implements ApplicationService<
    UpdatePaymentStatusCommand,
    AppointmentPaymentDto
> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly insuranceClaimRepository: InsuranceClaimRepository,
        private readonly patientPackageRepository: PatientPackageRepository,
        private readonly patientPackageCreditRepository: PatientPackageCreditRepository,
        private readonly patientSubscriptionUsageRepository: PatientSubscriptionUsageRepository,
        private readonly appointmentLedger: AppointmentLedger,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<UpdatePaymentStatusCommand>): Promise<AppointmentPaymentDto> {
        const {appointmentId, status, paidAt, amountBrl, notes} = payload;

        const appointment = await this.appointmentRepository.findById(appointmentId);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', appointmentId.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);

        const payment = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);

        if (payment === null) {
            throw new ResourceNotFoundException('Payment not found for this appointment.', appointmentId.toString());
        }

        const movingToRefunded =
            status === AppointmentPaymentStatus.REFUNDED && payment.status !== AppointmentPaymentStatus.REFUNDED;

        if (notes !== undefined) {
            payment.notes = notes ?? null;
        }

        if (payment.paymentMethod === PaymentMethod.MIXED || isLedgerPaymentMethod(payment.paymentMethod)) {
            await this.updateLedger(payment, {
                status,
                amountBrl,
                reason: notes ?? null,
                memberId: actor.clinicMemberId,
                competencyDate: appointment.startAt,
            });
        } else {
            const resolvedPaidAt = paidAt ?? (status === AppointmentPaymentStatus.PAID ? new Date() : payment.paidAt);

            payment.updateStatus(status, resolvedPaidAt ?? null);

            if (amountBrl !== undefined) {
                payment.amountBrl = amountBrl;
            }
        }

        await this.appointmentPaymentRepository.save(payment);

        if (movingToRefunded && payment.paymentMethod === PaymentMethod.PACKAGE && payment.patientPackageId) {
            const refunded = await this.patientPackageRepository.refundCredit(payment.patientPackageId);

            const credit = PatientPackageCredit.create({
                clinicId: actor.clinicId,
                patientPackageId: payment.patientPackageId,
                appointmentPaymentId: payment.id,
                type: PatientPackageCreditEventType.REFUND,
                delta: 1,
                balanceAfter: refunded.remainingCredits,
                registeredByMemberId: actor.clinicMemberId,
            });

            await this.patientPackageCreditRepository.save(credit);
        }

        if (movingToRefunded && payment.paymentMethod === PaymentMethod.SUBSCRIPTION && payment.patientSubscriptionId) {
            // Consumption always happens at registration time (`now()`), so the payment's own
            // createdAt deterministically identifies which monthly period was debited.
            const periodYear = payment.createdAt.getFullYear();
            const periodMonth = payment.createdAt.getMonth() + 1;

            const usage = await this.patientSubscriptionUsageRepository.findCurrentPeriod(
                payment.patientSubscriptionId,
                periodYear,
                periodMonth
            );

            if (usage !== null) {
                await this.patientSubscriptionUsageRepository.refundAppointment(usage.id);
            }
        }

        if (movingToRefunded && payment.paymentMethod === PaymentMethod.INSURANCE) {
            const claim = await this.insuranceClaimRepository.findByAppointmentPaymentId(payment.id);

            if (claim !== null && claim.claimStatus !== InsuranceClaimStatus.PAID) {
                claim.cancel();
                await this.insuranceClaimRepository.save(claim);
            }
        }

        this.eventDispatcher.dispatch(actor, payment);

        return new AppointmentPaymentDto(payment);
    }

    /**
     * Pagamentos em dinheiro, Pix, cartão ou transferência mudam pelo livro-caixa: pagar
     * registra a entrada do que falta, estornar registra a saída com motivo. Voltar para
     * pendente ou sem cobrança depois de receber exige um estorno antes.
     */
    private async updateLedger(
        payment: AppointmentPayment,
        change: {
            status: AppointmentPaymentStatus;
            amountBrl: number | undefined;
            reason: string | null;
            memberId: ClinicMemberId;
            competencyDate: Date;
        }
    ): Promise<void> {
        const {status, amountBrl, reason, memberId, competencyDate} = change;
        const amountCents = centsFromBrl(amountBrl ?? payment.amountBrl);
        const found = await this.appointmentLedger.find(payment);
        const entry =
            found ??
            (status === AppointmentPaymentStatus.EXEMPT
                ? null
                : await this.appointmentLedger.open(payment, amountCents, competencyDate, memberId));

        if (entry === null) {
            payment.updateStatus(status, null);

            return;
        }

        if (amountBrl !== undefined && amountCents !== entry.amountCents) {
            await this.appointmentLedger.changeAmount(payment, entry, amountCents);
        }

        const received = entry.receivedCents() > 0;

        switch (status) {
            case AppointmentPaymentStatus.PAID: {
                if (!entry.isSettled()) {
                    if (payment.paymentMethod === PaymentMethod.MIXED) {
                        throw new PreconditionException(FinancialEntryExceptions.parts_required);
                    }

                    await this.appointmentLedger.receive(
                        payment,
                        entry,
                        [{paymentMethod: payment.paymentMethod, amountCents: entry.remainingCents(), accountId: null}],
                        memberId
                    );
                } else {
                    this.appointmentLedger.reflect(payment, entry);
                }

                return;
            }

            case AppointmentPaymentStatus.REFUNDED: {
                if (received) {
                    if (reason === null || reason.trim() === '') {
                        throw new InvalidInputException(FinancialEntryExceptions.refund_reason_required, [
                            {field: 'notes', reason: 'A refund reason is required when money was received'},
                        ]);
                    }

                    await this.appointmentLedger.refund(entry, reason, memberId);
                }

                payment.updateStatus(AppointmentPaymentStatus.REFUNDED, payment.paidAt);

                return;
            }

            case AppointmentPaymentStatus.PENDING:
            case AppointmentPaymentStatus.EXEMPT: {
                if (received) {
                    throw new PreconditionException(FinancialEntryExceptions.has_receipts);
                }

                payment.updateStatus(status, null);
            }
        }
    }
}
