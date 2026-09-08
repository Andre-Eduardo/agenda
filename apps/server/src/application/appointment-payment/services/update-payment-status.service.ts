import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentPaymentDto, UpdatePaymentStatusDto} from '@application/appointment-payment/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId} from '@domain/appointment/entities';
import {EventDispatcher} from '@domain/event';
import {InsuranceClaimStatus} from '@domain/insurance-claim/entities';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';
import {PatientPackageCredit, PatientPackageCreditEventType} from '@domain/patient-package/entities';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';

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
        private readonly eventDispatcher: EventDispatcher
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<UpdatePaymentStatusCommand>): Promise<AppointmentPaymentDto> {
        const {appointmentId, status, paidAt, amountBrl, notes} = payload;

        const appointment = await this.appointmentRepository.findById(appointmentId);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', appointmentId.toString());
        }

        if (!appointment.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Appointment does not belong to the current clinic.');
        }

        const payment = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);

        if (payment === null) {
            throw new ResourceNotFoundException('Payment not found for this appointment.', appointmentId.toString());
        }

        const movingToRefunded =
            status === AppointmentPaymentStatus.REFUNDED && payment.status !== AppointmentPaymentStatus.REFUNDED;

        const resolvedPaidAt = paidAt ?? (status === AppointmentPaymentStatus.PAID ? new Date() : payment.paidAt);

        payment.updateStatus(status, resolvedPaidAt ?? null);

        if (amountBrl !== undefined) {
            payment.amountBrl = amountBrl;
        }

        if (notes !== undefined) {
            payment.notes = notes ?? null;
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
}
