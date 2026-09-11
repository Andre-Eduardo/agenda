import {mock} from 'jest-mock-extended';
import {UpdatePaymentStatusService} from '@application/appointment-payment/services/update-payment-status.service';
import type {Actor} from '@domain/@shared/actor';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentPayment, AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
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
        atomicExecutor = mock<AtomicExecutor>();
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());

        service = new UpdatePaymentStatusService(
            appointmentRepository,
            appointmentPaymentRepository,
            insuranceClaimRepository,
            patientPackageRepository,
            patientPackageCreditRepository,
            patientSubscriptionUsageRepository,
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
});
