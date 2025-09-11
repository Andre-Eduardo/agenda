import {RoomPermission, Permission, ProductPermission, SupplierPermission, UserPermission} from '../permission';

describe('A permission', () => {
    it.each([
        ['product:view', ProductPermission.VIEW],
        ['room:create', RoomPermission.CREATE],
        ['supplier:update', SupplierPermission.UPDATE],
        ['user:view-profile', UserPermission.VIEW_PROFILE],
    ])('can be created from a string', (value, permision) => {
        expect(Permission.of(value)).toBe(permision);
        expect(Permission.of(value)).toBe(permision);
        expect(Permission.of(value)).toBe(permision);
        expect(Permission.of(value)).toBe(permision);
    });

    it('should fail to create a permission from an invalid string', () => {
        expect(() => Permission.of('foo')).toThrow('Unknown permission: foo');
    });
});
