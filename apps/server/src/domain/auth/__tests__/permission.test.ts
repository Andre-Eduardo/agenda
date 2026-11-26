import {
    ClinicLicensePermission,
    Permission,
    PatientPermission,
    RoomPermission,
    SupportAccessPermission,
    SupportUserPermission,
    UserPermission,
} from '../permission';

describe('A permission', () => {
    it.each([
        ['patient:view', PatientPermission.VIEW],
        ['room:create', RoomPermission.CREATE],
        ['clinic-license:manage', ClinicLicensePermission.MANAGE],
        ['user:view-profile', UserPermission.VIEW_PROFILE],
    ])('can be created from a string', (value, permission) => {
        expect(Permission.of(value)).toBe(permission);
    });

    it('should fail to create a permission from an invalid string', () => {
        expect(() => Permission.of('foo')).toThrow('Unknown permission: foo');
    });

    it('should list all permissions', () => {
        const permissions = Permission.all();

        expect(permissions.has(PatientPermission.VIEW)).toBe(true);
        expect(permissions.has(ClinicLicensePermission.MANAGE)).toBe(true);
    });

    it('should exclude global-only permissions from the clinic-scoped permissions', () => {
        const permissions = Permission.clinicScoped();

        expect(permissions.has(PatientPermission.VIEW)).toBe(true);
        expect(permissions.has(ClinicLicensePermission.MANAGE)).toBe(false);
        expect(permissions.has(SupportAccessPermission.ENTER)).toBe(false);
        expect(permissions.has(SupportUserPermission.MANAGE)).toBe(false);
        expect(permissions.size).toBe(
            Permission.all().size -
                Object.values(ClinicLicensePermission).length -
                Object.values(SupportAccessPermission).length -
                Object.values(SupportUserPermission).length
        );
    });
});
