import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentPaymentLedgerDto} from '@application/appointment-payment/dtos';
import {loadAppointmentPayment} from '@application/appointment-payment/services/load-appointment-payment';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import type {AppointmentId} from '@domain/appointment/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {AppointmentLedger} from '@domain/financial-entry/services';

export type GetPaymentLedgerCommand = {appointmentId: AppointmentId};

/** Recebimentos e estornos de um pagamento, com o que falta receber. */
@Injectable()
export class GetPaymentLedgerService implements ApplicationService<
    GetPaymentLedgerCommand,
    AppointmentPaymentLedgerDto
> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly financialAccountRepository: FinancialAccountRepository,
        private readonly appointmentLedger: AppointmentLedger
    ) {}

    async execute({actor, payload}: Command<GetPaymentLedgerCommand>): Promise<AppointmentPaymentLedgerDto> {
        const {payment} = await loadAppointmentPayment(
            {appointments: this.appointmentRepository, payments: this.appointmentPaymentRepository},
            actor,
            payload.appointmentId
        );

        const [entry, accounts] = await Promise.all([
            this.appointmentLedger.find(payment),
            this.financialAccountRepository.findByClinicId(actor.clinicId),
        ]);

        return new AppointmentPaymentLedgerDto(payment, entry, accounts);
    }
}
