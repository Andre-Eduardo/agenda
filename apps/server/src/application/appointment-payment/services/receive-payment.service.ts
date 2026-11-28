import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentPaymentLedgerDto, ReceivePaymentDto} from '@application/appointment-payment/dtos';
import {loadAppointmentPayment} from '@application/appointment-payment/services/load-appointment-payment';
import {PreconditionException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {centsFromBrl} from '@domain/appointment-payment/brl';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {AppointmentId} from '@domain/appointment/entities';
import {EventDispatcher} from '@domain/event';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {FinancialEntryExceptions, isLedgerPaymentMethod} from '@domain/financial-entry/entities';
import {AppointmentLedger} from '@domain/financial-entry/services';

export type ReceivePaymentCommand = ReceivePaymentDto & {appointmentId: AppointmentId};

/** Registra mais um recebimento (ou vários, com formas diferentes) num pagamento em aberto. */
@Injectable()
export class ReceivePaymentService implements ApplicationService<ReceivePaymentCommand, AppointmentPaymentLedgerDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly financialAccountRepository: FinancialAccountRepository,
        private readonly appointmentLedger: AppointmentLedger,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<ReceivePaymentCommand>): Promise<AppointmentPaymentLedgerDto> {
        const {appointment, payment} = await loadAppointmentPayment(
            {appointments: this.appointmentRepository, payments: this.appointmentPaymentRepository},
            actor,
            payload.appointmentId
        );

        if (payment.paymentMethod !== PaymentMethod.MIXED && !isLedgerPaymentMethod(payment.paymentMethod)) {
            throw new PreconditionException(FinancialEntryExceptions.method_not_allowed);
        }

        const entry = await this.appointmentLedger.open(
            payment,
            centsFromBrl(payment.amountBrl),
            appointment.startAt,
            actor.clinicMemberId
        );

        await this.appointmentLedger.receive(
            payment,
            entry,
            payload.parts.map((part) => ({
                paymentMethod: part.paymentMethod,
                amountCents: centsFromBrl(part.amountBrl),
                accountId: part.accountId ?? null,
            })),
            actor.clinicMemberId
        );

        await this.appointmentPaymentRepository.save(payment);
        this.eventDispatcher.dispatch(actor, payment);

        const accounts = await this.financialAccountRepository.findByClinicId(actor.clinicId);

        return new AppointmentPaymentLedgerDto(payment, entry, accounts);
    }
}
