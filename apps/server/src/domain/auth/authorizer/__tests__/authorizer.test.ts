import {CompanyId} from '../../../company/entities';
import {UserId} from '../../../user/entities';
import type {Permission} from '../../permission';
import {RoomCategoryPermission, ProductPermission, SupplierPermission} from '../../permission';
import {Authorizer} from '../authorizer';

class AuthorizerTest extends Authorizer {
    getPermissions(): Promise<Set<Permission>> {
        return Promise.resolve(
            new Set([RoomCategoryPermission.VIEW, ProductPermission.DELETE, SupplierPermission.UPDATE])
        );
    }
}

describe('An authorizer', () => {
    const authorizer = new AuthorizerTest();

    it.each([
        [RoomCategoryPermission.VIEW, true],
        [ProductPermission.DELETE, true],
        [SupplierPermission.UPDATE, true],
        [RoomCategoryPermission.UPDATE, false],
    ])('should validate permissions', async (permission, expected) => {
        const userId = UserId.generate();
        const companyId = CompanyId.generate();

        jest.spyOn(authorizer, 'getPermissions');

        await expect(authorizer.validate(companyId, userId, permission)).resolves.toBe(expected);

        expect(authorizer.getPermissions).toHaveBeenCalledWith(companyId, userId);
    });
});
