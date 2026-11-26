import {AccessDeniedReason} from '../../../@shared/exceptions';
import {ClinicMemberId} from '../../../clinic-member/entities';
import {UserId} from '../../../user/entities';
import type {Permission} from '../../permission';
import {PatientPermission, RoomPermission, UserPermission} from '../../permission';
import {Authorizer} from '../authorizer';

class AuthorizerTest extends Authorizer {
    getPermissions(): Promise<Set<Permission>> {
        return Promise.resolve(new Set([PatientPermission.VIEW, RoomPermission.DELETE, UserPermission.UPDATE]));
    }
}

describe('An authorizer', () => {
    const authorizer = new AuthorizerTest();

    it.each([
        [PatientPermission.VIEW, true],
        [RoomPermission.DELETE, true],
        [UserPermission.UPDATE, true],
        [PatientPermission.UPDATE, false],
    ])('should validate permissions', async (permission, expected) => {
        const userId = UserId.generate();
        const clinicMemberId = ClinicMemberId.generate();

        jest.spyOn(authorizer, 'getPermissions');

        await expect(authorizer.validate(clinicMemberId, userId, permission)).resolves.toBe(expected);

        expect(authorizer.getPermissions).toHaveBeenCalledWith(clinicMemberId, userId);
    });

    it('should report insufficient permissions as the default denial reason', async () => {
        await expect(authorizer.denialReason(null, UserId.generate(), [PatientPermission.UPDATE])).resolves.toBe(
            AccessDeniedReason.INSUFFICIENT_PERMISSIONS
        );
    });
});
