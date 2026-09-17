import {mock} from 'jest-mock-extended';
import {CreatePatientInsuranceEnrollmentService} from '@application/patient-insurance-enrollment/services/create-patient-insurance-enrollment.service';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {InsurancePlan, InsurancePlanId} from '@domain/insurance-plan/entities';
import {InsurancePlanRepository} from '@domain/insurance-plan/insurance-plan.repository';
import {PatientInsuranceEnrollment} from '@domain/patient-insurance-enrollment/entities';
import {PatientInsuranceEnrollmentRepository} from '@domain/patient-insurance-enrollment/patient-insurance-enrollment.repository';
import {Patient, PatientId} from '@domain/patient/entities';
import {PatientRepository} from '@domain/patient/patient.repository';

describe('CreatePatientInsuranceEnrollmentService', () => {
    const clinicId = ClinicId.generate();
    const patientId = PatientId.generate();
    const actor = {
        userId: null,
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    } as unknown as Actor;

    let enrollmentRepository: ReturnType<typeof mock<PatientInsuranceEnrollmentRepository>>;
    let patientRepository: ReturnType<typeof mock<PatientRepository>>;
    let insurancePlanRepository: ReturnType<typeof mock<InsurancePlanRepository>>;
    let eventDispatcher: ReturnType<typeof mock<EventDispatcher>>;
    let service: CreatePatientInsuranceEnrollmentService;

    const plan = {clinicId, id: InsurancePlanId.generate()} as unknown as InsurancePlan;

    beforeEach(() => {
        enrollmentRepository = mock<PatientInsuranceEnrollmentRepository>();
        patientRepository = mock<PatientRepository>();
        insurancePlanRepository = mock<InsurancePlanRepository>();
        eventDispatcher = mock<EventDispatcher>();

        patientRepository.findById.mockResolvedValue({change: jest.fn()} as unknown as Patient);
        insurancePlanRepository.findById.mockResolvedValue(plan);
        enrollmentRepository.findByPatientAndPlan.mockResolvedValue(null);
        enrollmentRepository.findByPatientId.mockResolvedValue([]);

        service = new CreatePatientInsuranceEnrollmentService(
            enrollmentRepository,
            patientRepository,
            insurancePlanRepository,
            eventDispatcher
        );
    });

    it('should make the first enrollment for a patient primary even if not requested', async () => {
        const result = await service.execute({
            actor,
            payload: {
                patientId,
                insurancePlanId: InsurancePlanId.generate(),
                cardNumber: null,
                validFrom: null,
                validUntil: null,
                isPrimary: false,
            },
        });

        expect(result.isPrimary).toBe(true);
        expect(enrollmentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should unset the previous primary when a new one is explicitly requested', async () => {
        const previousPrimary = PatientInsuranceEnrollment.create({
            clinicId,
            patientId,
            insurancePlanId: InsurancePlanId.generate(),
            isPrimary: true,
        });

        enrollmentRepository.findByPatientId.mockResolvedValue([previousPrimary]);

        const result = await service.execute({
            actor,
            payload: {
                patientId,
                insurancePlanId: InsurancePlanId.generate(),
                cardNumber: null,
                validFrom: null,
                validUntil: null,
                isPrimary: true,
            },
        });

        expect(result.isPrimary).toBe(true);
        expect(previousPrimary.isPrimary).toBe(false);
        expect(enrollmentRepository.save).toHaveBeenCalledWith(previousPrimary);
    });

    it('should throw when the patient is already linked to the plan', async () => {
        const insurancePlanId = InsurancePlanId.generate();

        enrollmentRepository.findByPatientAndPlan.mockResolvedValue(
            PatientInsuranceEnrollment.create({clinicId, patientId, insurancePlanId})
        );

        await expect(
            service.execute({
                actor,
                payload: {
                    patientId,
                    insurancePlanId,
                    cardNumber: null,
                    validFrom: null,
                    validUntil: null,
                    isPrimary: false,
                },
            })
        ).rejects.toThrowWithMessage(PreconditionException, 'patient_insurance_enrollment.already_linked');
    });
});
