import {
    AppointmentPaymentPermission,
    InsuranceClaimPermission,
    PatientInsuranceEnrollmentPermission,
    PatientPackagePermission,
    PatientSubscriptionPermission,
    PackagePlanPermission,
} from '@domain/auth/permission';
import {ClinicMemberRole} from '@domain/clinic-member/entities';
import {clinicMemberRolePermissionsMap} from '../clinic-member-role.authorizer';

describe('clinic member financial permissions', () => {
    it('allows secretaries to operate patient coverage and payments', () => {
        const permissions = clinicMemberRolePermissionsMap[ClinicMemberRole.SECRETARY];

        expect(permissions.has(AppointmentPaymentPermission.REGISTER)).toBe(true);
        expect(permissions.has(AppointmentPaymentPermission.UPDATE)).toBe(true);
        expect(permissions.has(PatientInsuranceEnrollmentPermission.CREATE)).toBe(true);
        expect(permissions.has(PatientInsuranceEnrollmentPermission.UPDATE)).toBe(true);
        expect(permissions.has(PatientPackagePermission.SELL)).toBe(true);
        expect(permissions.has(PatientSubscriptionPermission.SUBSCRIBE)).toBe(true);
        expect(permissions.has(PatientSubscriptionPermission.CANCEL)).toBe(true);
    });

    it('keeps professionals on read-only financial coverage', () => {
        const permissions = clinicMemberRolePermissionsMap[ClinicMemberRole.PROFESSIONAL];

        expect(permissions.has(AppointmentPaymentPermission.VIEW)).toBe(true);
        expect(permissions.has(PatientInsuranceEnrollmentPermission.VIEW)).toBe(true);
        expect(permissions.has(InsuranceClaimPermission.VIEW)).toBe(true);
        expect(permissions.has(PackagePlanPermission.VIEW)).toBe(true);
        expect(permissions.has(AppointmentPaymentPermission.REGISTER)).toBe(false);
        expect(permissions.has(InsuranceClaimPermission.UPDATE)).toBe(false);
        expect(permissions.has(PatientPackagePermission.SELL)).toBe(false);
        expect(permissions.has(PatientSubscriptionPermission.SUBSCRIBE)).toBe(false);
    });
});
