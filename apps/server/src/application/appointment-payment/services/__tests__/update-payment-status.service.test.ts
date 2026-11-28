import {mock} from 'jest-mock-extended';
import {UpdatePaymentStatusService} from '@application/appointment-payment/services/update-payment-status.service';
import type {Actor} from '@domain/@shared/actor';
import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentPayment, AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {FinancialAccountId} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {FinancialEntry, FinancialEntryExceptions} from '@domain/financial-entry/entities';
import {FinancialEntryRepository} from '@domain/financial-entry/financial-entry.repository';
import {AppointmentLedger} from '@domain/financial-entry/services';
import {InsuranceClaim, InsuranceClaimStatus} from '@domain/insurance-claim/entities';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PatientInsuranceEnrollmentId} from '@domain/patient-insurance-enrollment/entities';
import {PatientPackageId} from '@domain/patient-package/entities';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {PatientSubscriptionId} from '@domain/patient-subscription/entities';
import {PatientSubscriptionUsageRepository} from '@domain/patient-subscription/patient-subscription-usage.repository';
import {PatientId} from '@domain/patient/entities';

function payload(appointmentId: Appointment['id'], status: AppointmentPaymentStatus, notes?: string) {
    return {appointmentId, status, paidAt: null, amountBrl: undefined, notes};
}

describe('UpdatePaymentStatusService', () => {
    const clinicId = ClinicId.generate();
    const patientId = PatientId.generate();
    const actor = {
        userId: null,
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    } as unknown as Actor;

    let appointmentRepository: ReturnType<typeof mock<AppointmentRepository>>;
    let appointmentPaymentRepository: ReturnType<typeof mock<AppointmentPaymentRepository>>;
    let insuranceClaimRepository: ReturnType<typeof mock<InsuranceClaimRepository>>;
    let patientPackageRepository: ReturnType<typeof mock<PatientPackageRepository>>;
    let patientPackageCreditRepository: ReturnType<typeof mock<PatientPackageCreditRepository>>;
    let patientSubscriptionUsageRepository: ReturnType<typeof mock<PatientSubscriptionUsageRepository>>;
    let eventDispatcher: ReturnType<typeof mock<EventDispatcher>>;
    let financialAccountRepository: ReturnType<typeof mock<FinancialAccountRepository>>;
    let financialEntryRepository: ReturnType<typeof mock<FinancialEntryRepository>>;
    let atomicExecutor: ReturnType<typeof mock<AtomicExecutor>>;
    let service: UpdatePaymentStatusService;

    function createAppointment(): Appointment {
        return Appointment.create({
            clinicId,
            patientId,
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: actor.clinicMemberId,
            startAt: new Date('2020-01-01T09:00:00.000Z'),
            endAt: new Date('2020-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.FIRST_VISIT,
            status: AppointmentStatus.COMPLETED,
        });
    }

    beforeEach(() => {
        appointmentRepository = mock<AppointmentRepository>();
        appointmentPaymentRepository = mock<AppointmentPaymentRepository>();
        insuranceClaimRepository = mock<InsuranceClaimRepository>();
        patientPackageRepository = mock<PatientPackageRepository>();
        patientPackageCreditRepository = mock<PatientPackageCreditRepository>();
        patientSubscriptionUsageRepository = mock<PatientSubscriptionUsageRepository>();
        eventDispatcher = mock<EventDispatcher>();
        financialAccountRepository = mock<FinancialAccountRepository>();
        financialEntryRepository = mock<FinancialEntryRepository>();
        financialEntryRepository.findByAppointmentPaymentId.mockResolvedValue(null);
        financialAccountRepository.findDefault.mockResolvedValue(null);
        atomicExecutor = mock<AtomicExecutor>();
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());

        service = new UpdatePaymentStatusService(
            appointmentRepository,
            appointmentPaymentRepository,
            insuranceClaimRepository,
            patientPackageRepository,
            patientPackageCreditRepository,
            patientSubscriptionUsageRepository,
            new AppointmentLedger(financialAccountRepository, financialEntryRepository),
            eventDispatcher
        );
        (service as unknown as {atomicExecutor: AtomicExecutor}).atomicExecutor = atomicExecutor;
    });

    it('should refund a package credit and record it in the ledger when a PACKAGE payment is refunded', async () => {
        const appointment = createAppointment();
        const patientPackageId = PatientPackageId.generate();
        const payment = AppointmentPayment.create({
            clinicId,
            appointmentId: appointment.id,
            patientId,
            registeredByMemberId: actor.clinicMemberId,
            paymentMethod: PaymentMethod.PACKAGE,
            status: AppointmentPaymentStatus.PAID,
            amountBrl: 100,
            patientPackageId,
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
        patientPackageRepository.refundCredit.mockResolvedValue({remainingCredits: 5});

        await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                status: AppointmentPaymentStatus.REFUNDED,
                paidAt: null,
                amountBrl: undefined,
                notes: undefined,
            },
        });

        expect(patientPackageRepository.refundCredit).toHaveBeenCalledWith(patientPackageId);
        expect(patientPackageCreditRepository.save).toHaveBeenCalledTimes(1);
        const savedCredit = patientPackageCreditRepository.save.mock.calls[0]?.[0];

        expect(savedCredit?.delta).toBe(1);
        expect(savedCredit?.balanceAfter).toBe(5);
    });

    it('should cancel the insurance claim when an INSURANCE payment is refunded and the claim is not yet paid', async () => {
        const appointment = createAppointment();
        const payment = AppointmentPayment.create({
            clinicId,
            appointmentId: appointment.id,
            patientId,
            registeredByMemberId: actor.clinicMemberId,
            paymentMethod: PaymentMethod.INSURANCE,
            status: AppointmentPaymentStatus.PENDING,
            amountBrl: 200,
            insurancePlanId: InsurancePlanId.generate(),
        });
        const claim = InsuranceClaim.create({
            clinicId,
            appointmentPaymentId: payment.id,
            patientInsuranceEnrollmentId: PatientInsuranceEnrollmentId.generate(),
            insurancePlanId: InsurancePlanId.generate(),
            authorizationCode: null,
            submittedAmountBrl: 200,
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
        insuranceClaimRepository.findByAppointmentPaymentId.mockResolvedValue(claim);

        await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                status: AppointmentPaymentStatus.REFUNDED,
                paidAt: null,
                amountBrl: undefined,
                notes: undefined,
            },
        });

        expect(claim.claimStatus).toBe(InsuranceClaimStatus.CANCELLED);
        expect(insuranceClaimRepository.save).toHaveBeenCalledWith(claim);
    });

    it('should not touch the package or claim when the new status is not REFUNDED', async () => {
        const appointment = createAppointment();
        const payment = AppointmentPayment.create({
            clinicId,
            appointmentId: appointment.id,
            patientId,
            registeredByMemberId: actor.clinicMemberId,
            paymentMethod: PaymentMethod.PACKAGE,
            status: AppointmentPaymentStatus.PENDING,
            amountBrl: 100,
            patientPackageId: PatientPackageId.generate(),
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);

        await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                status: AppointmentPaymentStatus.PAID,
                paidAt: null,
                amountBrl: undefined,
                notes: undefined,
            },
        });

        expect(patientPackageRepository.refundCredit).not.toHaveBeenCalled();
        expect(insuranceClaimRepository.findByAppointmentPaymentId).not.toHaveBeenCalled();
    });

    it('should refund the subscription quota for the period the payment was created in when a SUBSCRIPTION payment is refunded', async () => {
        const appointment = createAppointment();
        const patientSubscriptionId = PatientSubscriptionId.generate();
        const payment = AppointmentPayment.create({
            clinicId,
            appointmentId: appointment.id,
            patientId,
            registeredByMemberId: actor.clinicMemberId,
            paymentMethod: PaymentMethod.SUBSCRIPTION,
            status: AppointmentPaymentStatus.PAID,
            amountBrl: 100,
            patientSubscriptionId,
        });
        const usage = {id: 'usage-id'} as Awaited<ReturnType<PatientSubscriptionUsageRepository['findCurrentPeriod']>>;

        appointmentRepository.findById.mockResolvedValue(appointment);
        appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
        patientSubscriptionUsageRepository.findCurrentPeriod.mockResolvedValue(usage);

        await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                status: AppointmentPaymentStatus.REFUNDED,
                paidAt: null,
                amountBrl: undefined,
                notes: undefined,
            },
        });

        expect(patientSubscriptionUsageRepository.findCurrentPeriod).toHaveBeenCalledWith(
            patientSubscriptionId,
            payment.createdAt.getFullYear(),
            payment.createdAt.getMonth() + 1
        );
        expect(patientSubscriptionUsageRepository.refundAppointment).toHaveBeenCalledWith(usage?.id);
    });

    describe('ledger', () => {
        function pixPayment(appointmentId: Appointment['id'], status: AppointmentPaymentStatus): AppointmentPayment {
            return AppointmentPayment.create({
                clinicId,
                appointmentId,
                patientId,
                registeredByMemberId: actor.clinicMemberId,
                paymentMethod: PaymentMethod.PIX,
                status,
                amountBrl: 100,
            });
        }

        function openEntry(payment: AppointmentPayment, receivedCents: number): FinancialEntry {
            const entry = FinancialEntry.openAppointmentReceivable({
                clinicId,
                appointmentPaymentId: payment.id,
                amountCents: 10000,
                competencyDate: new Date(),
                createdByMemberId: actor.clinicMemberId,
            });

            if (receivedCents > 0) {
                entry.receive(
                    [
                        {
                            accountId: FinancialAccountId.generate(),
                            paymentMethod: PaymentMethod.PIX,
                            amountCents: receivedCents,
                        },
                    ],
                    actor.clinicMemberId
                );
                entry.takePendingMovements();
            }

            return entry;
        }

        it('receives what is left when a pending payment is marked as paid', async () => {
            const appointment = createAppointment();
            const payment = pixPayment(appointment.id, AppointmentPaymentStatus.PENDING);
            const entry = openEntry(payment, 4000);

            appointmentRepository.findById.mockResolvedValue(appointment);
            appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
            financialEntryRepository.findByAppointmentPaymentId.mockResolvedValue(entry);

            const result = await service.execute({
                actor,
                payload: payload(appointment.id, AppointmentPaymentStatus.PAID),
            });

            expect(entry.movements.at(-1)?.amountCents).toBe(6000);
            expect(entry.isSettled()).toBe(true);
            expect(result.status).toBe(AppointmentPaymentStatus.PAID);
        });

        it('asks for a reason before refunding money that was received', async () => {
            const appointment = createAppointment();
            const payment = pixPayment(appointment.id, AppointmentPaymentStatus.PAID);

            appointmentRepository.findById.mockResolvedValue(appointment);
            appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
            financialEntryRepository.findByAppointmentPaymentId.mockResolvedValue(openEntry(payment, 10000));

            await expect(
                service.execute({actor, payload: payload(appointment.id, AppointmentPaymentStatus.REFUNDED)})
            ).rejects.toThrowWithMessage(InvalidInputException, FinancialEntryExceptions.refund_reason_required);
        });

        it('records the refund as an outgoing movement', async () => {
            const appointment = createAppointment();
            const payment = pixPayment(appointment.id, AppointmentPaymentStatus.PAID);
            const entry = openEntry(payment, 10000);

            appointmentRepository.findById.mockResolvedValue(appointment);
            appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
            financialEntryRepository.findByAppointmentPaymentId.mockResolvedValue(entry);

            const result = await service.execute({
                actor,
                payload: payload(appointment.id, AppointmentPaymentStatus.REFUNDED, 'Cobrança em duplicidade'),
            });

            expect(entry.receivedCents()).toBe(0);
            expect(entry.movements.at(-1)?.reason).toBe('Cobrança em duplicidade');
            expect(result.status).toBe(AppointmentPaymentStatus.REFUNDED);
        });

        it('does not move a payment back to pending after money was received', async () => {
            const appointment = createAppointment();
            const payment = pixPayment(appointment.id, AppointmentPaymentStatus.PAID);

            appointmentRepository.findById.mockResolvedValue(appointment);
            appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(payment);
            financialEntryRepository.findByAppointmentPaymentId.mockResolvedValue(openEntry(payment, 10000));

            await expect(
                service.execute({actor, payload: payload(appointment.id, AppointmentPaymentStatus.PENDING)})
            ).rejects.toThrowWithMessage(PreconditionException, FinancialEntryExceptions.has_receipts);
        });
    });
});
