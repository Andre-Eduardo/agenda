import {mock} from 'jest-mock-extended';
import {ClinicMemberId} from '../../../clinic-member/entities';
import {UserId} from '../../../user/entities';
import {fakeUser} from '../../../user/entities/__tests__/fake-user';
import type {UserRepository} from '../../../user/user.repository';
import {GlobalRole} from '../../global-role';
import {
    AppointmentPermission,
    AuditLogPermission,
    ClinicalProfilePermission,
    ClinicLicensePermission,
    Permission,
    RecordPermission,
    SupportAccessPermission,
    SupportUserPermission,
    UserPermission,
    WorkingHoursPermission,
} from '../../permission';
import {GlobalAuthorizer, SUPPORT_PERMISSIONS} from '../global.authorizer';

describe('A global authorizer', () => {
    const userRepository = mock<UserRepository>();
    const authorizer = new GlobalAuthorizer(userRepository);
    const basePermissions = new Set([UserPermission.VIEW_PROFILE, UserPermission.CHANGE_PASSWORD]);

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        [GlobalRole.SUPER_ADMIN, null, Permission.all()],
        [GlobalRole.SUPER_ADMIN, ClinicMemberId.generate(), Permission.all()],
        [GlobalRole.SUPPORT, null, new Set(SUPPORT_PERMISSIONS)],
        [GlobalRole.SUPPORT, ClinicMemberId.generate(), new Set(SUPPORT_PERMISSIONS)],
        [GlobalRole.OWNER, null, Permission.clinicScoped()],
        [GlobalRole.OWNER, ClinicMemberId.generate(), basePermissions],
        [GlobalRole.NONE, null, basePermissions],
        [GlobalRole.NONE, ClinicMemberId.generate(), basePermissions],
    ])(
        'should return the permissions for a user with global role %s (clinic member: %s)',
        async (globalRole, clinicMemberId, expected) => {
            const user = fakeUser({globalRole});

            userRepository.findById.mockResolvedValueOnce(user);

            await expect(authorizer.getPermissions(clinicMemberId, user.id)).resolves.toEqual(expected);

            expect(userRepository.findById).toHaveBeenCalledWith(user.id);
        }
    );

    it('should let a support user enter clinics and only read their non-clinical data', () => {
        expect(SUPPORT_PERMISSIONS).toContain(SupportAccessPermission.ENTER);
        expect(SUPPORT_PERMISSIONS).toContain(UserPermission.VIEW_PROFILE);
        expect(SUPPORT_PERMISSIONS).toContain(AppointmentPermission.VIEW);
        expect(SUPPORT_PERMISSIONS).toContain(AuditLogPermission.VIEW);

        // No writes.
        expect(SUPPORT_PERMISSIONS).not.toContain(AppointmentPermission.CREATE);
        expect(SUPPORT_PERMISSIONS).not.toContain(WorkingHoursPermission.MANAGE);
        // No clinical data, no other people's accounts.
        expect(SUPPORT_PERMISSIONS).not.toContain(RecordPermission.VIEW);
        expect(SUPPORT_PERMISSIONS).not.toContain(ClinicalProfilePermission.VIEW);
        expect(SUPPORT_PERMISSIONS).not.toContain(UserPermission.VIEW);
        // No platform administration.
        expect(SUPPORT_PERMISSIONS).not.toContain(ClinicLicensePermission.MANAGE);
        expect(SUPPORT_PERMISSIONS).not.toContain(SupportUserPermission.MANAGE);
    });

    it('should return no permissions for an unknown user', async () => {
        userRepository.findById.mockResolvedValueOnce(null);

        await expect(authorizer.getPermissions(null, UserId.generate())).resolves.toEqual(new Set());
    });
});
