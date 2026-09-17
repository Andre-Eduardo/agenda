import type {InsurancePlanId} from '@domain/insurance-plan/entities';
import type {
    PatientInsuranceEnrollment,
    PatientInsuranceEnrollmentId,
} from '@domain/patient-insurance-enrollment/entities';
import type {PatientId} from '@domain/patient/entities';

export interface PatientInsuranceEnrollmentRepository {
    findById(id: PatientInsuranceEnrollmentId): Promise<PatientInsuranceEnrollment | null>;

    findByPatientId(patientId: PatientId): Promise<PatientInsuranceEnrollment[]>;

    findByPatientAndPlan(
        patientId: PatientId,
        insurancePlanId: InsurancePlanId
    ): Promise<PatientInsuranceEnrollment | null>;

    /** Active enrollments for the patient other than the given one — used to unset a previous primary. */
    findOtherActiveByPatientId(
        patientId: PatientId,
        excludeId: PatientInsuranceEnrollmentId
    ): Promise<PatientInsuranceEnrollment[]>;

    findExpirable(on: Date): Promise<PatientInsuranceEnrollment[]>;

    save(enrollment: PatientInsuranceEnrollment): Promise<void>;
}

export abstract class PatientInsuranceEnrollmentRepository {}
