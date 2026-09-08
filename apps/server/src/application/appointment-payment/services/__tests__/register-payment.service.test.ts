import {mock} from 'jest-mock-extended';
import {RegisterPaymentService} from '@application/appointment-payment/services/register-payment.service';
import type {Actor} from '@domain/@shared/actor';
import {AtomicExecutor} from '@domain/@shared/repository';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {Appointment, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {InsuranceClaimRepository} from '@domain/insurance-claim/insurance-claim.repository';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PackagePlanId} from '@domain/package-plan/entities';
import {PatientInsuranceEnrollment} from '@domain/patient-insurance-enrollment/entities';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {PatientPackage, PatientPackageId} from '@domain/patient-package/entities';
import {PatientPackageCreditRepository} from '@domain/patient-package/patient-package-credit.repository';
import {PatientPackageRepository} from '@domain/patient-package/patient-package.repository';
import {PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

describe('RegisterPaymentService', () => {
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
    let patientRepository: ReturnType<typeof mock<PatientRepository>>;
    let patientInsuranceEnrollmentRepository: ReturnType<typeof mock<PatientInsuranceEnrollmentRepository>>;
    let insuranceClaimRepository: ReturnType<typeof mock<InsuranceClaimRepository>>;
    let patientPackageRepository: ReturnType<typeof mock<PatientPackageRepository>>;
    let patientPackageCreditRepository: ReturnType<typeof mock<PatientPackageCreditRepository>>;
    let eventDispatcher: ReturnType<typeof mock<EventDispatcher>>;
    let atomicExecutor: ReturnType<typeof mock<AtomicExecutor>>;
    let service: RegisterPaymentService;

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
        patientRepository = mock<PatientRepository>();
        patientInsuranceEnrollmentRepository = mock<PatientInsuranceEnrollmentRepository>();
        insuranceClaimRepository = mock<InsuranceClaimRepository>();
        patientPackageRepository = mock<PatientPackageRepository>();
        patientPackageCreditRepository = mock<PatientPackageCreditRepository>();
        eventDispatcher = mock<EventDispatcher>();
        atomicExecutor = mock<AtomicExecutor>();
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());

        appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(null);

        service = new RegisterPaymentService(
            appointmentRepository,
            appointmentPaymentRepository,
            patientRepository,
            patientInsuranceEnrollmentRepository,
            insuranceClaimRepository,
            patientPackageRepository,
            patientPackageCreditRepository,
            eventDispatcher
        );
        (service as unknown as {atomicExecutor: AtomicExecutor}).atomicExecutor = atomicExecutor;
    });

    it('should register a cash payment without creating an insurance claim', async () => {
        const appointment = createAppointment();

        appointmentRepository.findById.mockResolvedValue(appointment);

        const result = await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                paymentMethod: PaymentMethod.CASH,
                amountBrl: 150,
                status: AppointmentPaymentStatus.PAID,
                insurancePlanId: null,
                insuranceAuthCode: null,
                notes: null,
            },
        });

        expect(result.paymentMethod).toBe(PaymentMethod.CASH);
        expect(appointmentPaymentRepository.save).toHaveBeenCalled();
        expect(insuranceClaimRepository.save).not.toHaveBeenCalled();
    });

    it('should create an insurance claim when paymentMethod is INSURANCE and the patient is enrolled', async () => {
        const appointment = createAppointment();
        const insurancePlanId = InsurancePlanId.generate();
        const enrollment = PatientInsuranceEnrollment.create({
            clinicId,
            patientId,
            insurancePlanId,
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        patientInsuranceEnrollmentRepository.findByPatientAndPlan.mockResolvedValue(enrollment);

        const result = await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                paymentMethod: PaymentMethod.INSURANCE,
                amountBrl: 200,
                status: AppointmentPaymentStatus.PENDING,
                insurancePlanId,
                insuranceAuthCode: 'AUTH-123',
                notes: null,
            },
        });

        expect(result.paymentMethod).toBe(PaymentMethod.INSURANCE);
        expect(insuranceClaimRepository.save).toHaveBeenCalledTimes(1);
        const savedClaim = insuranceClaimRepository.save.mock.calls[0]?.[0];

        expect(savedClaim?.patientInsuranceEnrollmentId.equals(enrollment.id)).toBe(true);
        expect(savedClaim?.submittedAmountBrl).toBe(200);
        expect(savedClaim?.authorizationCode).toBe('AUTH-123');
    });

    it('should throw when paymentMethod is INSURANCE and the patient has no matching enrollment', async () => {
        const appointment = createAppointment();
        const insurancePlanId = InsurancePlanId.generate();

        appointmentRepository.findById.mockResolvedValue(appointment);
        patientInsuranceEnrollmentRepository.findByPatientAndPlan.mockResolvedValue(null);

        await expect(
            service.execute({
                actor,
                payload: {
                    appointmentId: appointment.id,
                    paymentMethod: PaymentMethod.INSURANCE,
                    amountBrl: 200,
                    status: AppointmentPaymentStatus.PENDING,
                    insurancePlanId,
                    insuranceAuthCode: null,
                    notes: null,
                },
            })
        ).rejects.toThrow();

        expect(appointmentPaymentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw when a payment already exists for the appointment', async () => {
        const appointment = createAppointment();

        appointmentRepository.findById.mockResolvedValue(appointment);
        appointmentPaymentRepository.findByAppointmentId.mockResolvedValue(
            {} as Awaited<ReturnType<AppointmentPaymentRepository['findByAppointmentId']>>
        );

        await expect(
            service.execute({
                actor,
                payload: {
                    appointmentId: appointment.id,
                    paymentMethod: PaymentMethod.CASH,
                    amountBrl: 100,
                    status: AppointmentPaymentStatus.PAID,
                    insurancePlanId: null,
                    insuranceAuthCode: null,
                    notes: null,
                },
            })
        ).rejects.toThrow();
    });

    it('should consume a package credit and record it in the ledger when paymentMethod is PACKAGE', async () => {
        const appointment = createAppointment();
        const patientPackage = PatientPackage.create({
            clinicId,
            patientId,
            packagePlanId: PackagePlanId.generate(),
            planNameSnapshot: '10 sessões',
            totalCredits: 10,
            priceBrl: 1000,
            purchasedAt: new Date('2020-01-01T00:00:00.000Z'),
            paymentMethod: PaymentMethod.CASH,
            soldByMemberId: ClinicMemberId.generate(),
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        patientPackageRepository.findById.mockResolvedValue(patientPackage);
        patientPackageRepository.consumeCredit.mockResolvedValue({remainingCredits: 9});

        const result = await service.execute({
            actor,
            payload: {
                appointmentId: appointment.id,
                paymentMethod: PaymentMethod.PACKAGE,
                amountBrl: 100,
                status: AppointmentPaymentStatus.PAID,
                insurancePlanId: null,
                insuranceAuthCode: null,
                patientPackageId: patientPackage.id,
                notes: null,
            },
        });

        expect(result.paymentMethod).toBe(PaymentMethod.PACKAGE);
        expect(patientPackageRepository.consumeCredit).toHaveBeenCalledWith(patientPackage.id);
        expect(patientPackageCreditRepository.save).toHaveBeenCalledTimes(1);
        const savedCredit = patientPackageCreditRepository.save.mock.calls[0]?.[0];

        expect(savedCredit?.delta).toBe(-1);
        expect(savedCredit?.balanceAfter).toBe(9);
    });

    it('should throw when paymentMethod is PACKAGE and the appointment is not COMPLETED', async () => {
        const appointment = Appointment.create({
            clinicId,
            patientId,
            attendedByMemberId: ClinicMemberId.generate(),
            createdByMemberId: actor.clinicMemberId,
            startAt: new Date('2020-01-01T09:00:00.000Z'),
            endAt: new Date('2020-01-01T10:00:00.000Z'),
            durationMinutes: 60,
            type: AppointmentType.FIRST_VISIT,
            status: AppointmentStatus.SCHEDULED,
        });

        appointmentRepository.findById.mockResolvedValue(appointment);

        await expect(
            service.execute({
                actor,
                payload: {
                    appointmentId: appointment.id,
                    paymentMethod: PaymentMethod.PACKAGE,
                    amountBrl: 100,
                    status: AppointmentPaymentStatus.PAID,
                    insurancePlanId: null,
                    insuranceAuthCode: null,
                    patientPackageId: PatientPackageId.generate(),
                    notes: null,
                },
            })
        ).rejects.toThrow();

        expect(patientPackageRepository.consumeCredit).not.toHaveBeenCalled();
    });

    it('should throw when the package has no credits left', async () => {
        const appointment = createAppointment();
        const patientPackage = PatientPackage.create({
            clinicId,
            patientId,
            packagePlanId: PackagePlanId.generate(),
            planNameSnapshot: '10 sessões',
            totalCredits: 10,
            priceBrl: 1000,
            purchasedAt: new Date('2020-01-01T00:00:00.000Z'),
            paymentMethod: PaymentMethod.CASH,
            soldByMemberId: ClinicMemberId.generate(),
        });

        appointmentRepository.findById.mockResolvedValue(appointment);
        patientPackageRepository.findById.mockResolvedValue(patientPackage);
        patientPackageRepository.consumeCredit.mockResolvedValue(null);

        await expect(
            service.execute({
                actor,
                payload: {
                    appointmentId: appointment.id,
                    paymentMethod: PaymentMethod.PACKAGE,
                    amountBrl: 100,
                    status: AppointmentPaymentStatus.PAID,
                    insurancePlanId: null,
                    insuranceAuthCode: null,
                    patientPackageId: patientPackage.id,
                    notes: null,
                },
            })
        ).rejects.toThrow();

        expect(patientPackageCreditRepository.save).not.toHaveBeenCalled();
    });
});
