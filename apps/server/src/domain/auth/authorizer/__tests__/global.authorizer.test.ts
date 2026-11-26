import {mock} from 'jest-mock-extended';
import {ClinicMemberId} from '../../../clinic-member/entities';
import {UserId} from '../../../user/entities';
import {fakeUser} from '../../../user/entities/__tests__/fake-user';
import type {UserRepository} from '../../../user/user.repository';
import {GlobalRole} from '../../global-role';
import {Permission, UserPermission} from '../../permission';
import {GlobalAuthorizer} from '../global.authorizer';

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

    it('should return no permissions for an unknown user', async () => {
        userRepository.findById.mockResolvedValueOnce(null);

        await expect(authorizer.getPermissions(null, UserId.generate())).resolves.toEqual(new Set());
    });
});
