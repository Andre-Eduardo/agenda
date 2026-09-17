import {ClinicId} from '@domain/clinic/entities';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {
    PatientInsuranceEnrollment,
    PatientInsuranceEnrollmentStatus,
} from '@domain/patient-insurance-enrollment/entities';
import {PatientId} from '@domain/patient/entities';

describe('PatientInsuranceEnrollment', () => {
    function createEnrollment() {
        return PatientInsuranceEnrollment.create({
            clinicId: ClinicId.generate(),
            patientId: PatientId.generate(),
            insurancePlanId: InsurancePlanId.generate(),
            isPrimary: true,
        });
    }

    it('should expire an active enrollment and clear its primary flag', () => {
        const enrollment = createEnrollment();

        enrollment.expire();

        expect(enrollment.status).toBe(PatientInsuranceEnrollmentStatus.EXPIRED);
        expect(enrollment.isPrimary).toBe(false);
    });

    it('should keep a cancelled enrollment unchanged when expiration runs', () => {
        const enrollment = createEnrollment();
        enrollment.cancel();

        enrollment.expire();

        expect(enrollment.status).toBe(PatientInsuranceEnrollmentStatus.CANCELLED);
    });
});
