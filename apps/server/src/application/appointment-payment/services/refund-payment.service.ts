import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentPaymentLedgerDto, RefundPaymentDto} from '@application/appointment-payment/dtos';
import {loadAppointmentPayment} from '@application/appointment-payment/services/load-appointment-payment';
import {PreconditionException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentPaymentStatus} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {AppointmentId} from '@domain/appointment/entities';
import {EventDispatcher} from '@domain/event';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {FinancialEntryExceptions} from '@domain/financial-entry/entities';
import {AppointmentLedger} from '@domain/financial-entry/services';

export type RefundPaymentCommand = RefundPaymentDto & {appointmentId: AppointmentId};

/** Estorna tudo o que foi recebido no pagamento, com motivo, e marca o pagamento como reembolsado. */
@Injectable()
export class RefundPaymentService implements ApplicationService<RefundPaymentCommand, AppointmentPaymentLedgerDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly financialAccountRepository: FinancialAccountRepository,
        private readonly appointmentLedger: AppointmentLedger,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<RefundPaymentCommand>): Promise<AppointmentPaymentLedgerDto> {
        const {payment} = await loadAppointmentPayment(
            {appointments: this.appointmentRepository, payments: this.appointmentPaymentRepository},
            actor,
            payload.appointmentId
        );

        const entry = await this.appointmentLedger.find(payment);

        if (entry === null) {
            throw new PreconditionException(FinancialEntryExceptions.nothing_to_refund);
        }

        await this.appointmentLedger.refund(entry, payload.reason, actor.clinicMemberId);

        payment.updateStatus(AppointmentPaymentStatus.REFUNDED, payment.paidAt);
        payment.notes ??= payload.reason;
        await this.appointmentPaymentRepository.save(payment);
        this.eventDispatcher.dispatch(actor, payment);

        const accounts = await this.financialAccountRepository.findByClinicId(actor.clinicId);

        return new AppointmentPaymentLedgerDto(payment, entry, accounts);
    }
}
