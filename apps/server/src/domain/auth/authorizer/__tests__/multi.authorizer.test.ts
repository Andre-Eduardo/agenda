import {mock} from 'jest-mock-extended';
import {ClinicMemberId} from '../../../clinic-member/entities';
import {UserId} from '../../../user/entities';
import {PatientPermission, RoomPermission, UserPermission} from '../../permission';
import type {Authorizer} from '../authorizer';
import {MultiAuthorizer} from '../multi.authorizer';

describe('A multi authorizer', () => {
    it('should return the union of the permissions returned by the authorizers', async () => {
        const userId = UserId.generate();
        const clinicMemberId = ClinicMemberId.generate();

        const firstAuthorizer = mock<Authorizer>();
        const secondAuthorizer = mock<Authorizer>();
        const thirdAuthorizer = mock<Authorizer>();

        firstAuthorizer.getPermissions.mockResolvedValueOnce(new Set([PatientPermission.VIEW]));
        secondAuthorizer.getPermissions.mockResolvedValueOnce(new Set([RoomPermission.DELETE, UserPermission.VIEW]));
        thirdAuthorizer.getPermissions.mockResolvedValueOnce(new Set());

        const authorizer = new MultiAuthorizer(firstAuthorizer, secondAuthorizer, thirdAuthorizer);

        await expect(authorizer.getPermissions(clinicMemberId, userId)).resolves.toEqual(
            new Set([PatientPermission.VIEW, RoomPermission.DELETE, UserPermission.VIEW])
        );

        expect(firstAuthorizer.getPermissions).toHaveBeenCalledWith(clinicMemberId, userId);
        expect(secondAuthorizer.getPermissions).toHaveBeenCalledWith(clinicMemberId, userId);
        expect(thirdAuthorizer.getPermissions).toHaveBeenCalledWith(clinicMemberId, userId);
    });
});
