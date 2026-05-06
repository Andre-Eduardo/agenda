import {mock} from 'jest-mock-extended';
import {Email} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {UserId} from '../../../user/entities';
import {fakeUser} from '../../../user/entities/__tests__/fake-user';
import type {UserRepository} from '../../../user/user.repository';
import {ObfuscatedPassword, Username} from '../../../user/value-objects';
import {GlobalRole} from '../../global-role';
import {GlobalAuthorizer, permissionsMap} from '../global.authorizer';

describe('A global authorizer', () => {
    const userRepository = mock<UserRepository>();
    const authorizer = new GlobalAuthorizer(userRepository);

    it.each(Object.values(GlobalRole))('should return the permissions for a user with global role %s', async (role) => {
        const user = fakeUser({
            username: Username.create('john_doe'),
            email: Email.create('john_doe@example.com'),
            password: await ObfuscatedPassword.obfuscate('Pa$$w0rd'),
            firstName: 'John',
            lastName: 'Doe',
            globalRole: role,
            companies: [CompanyId.generate()],
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(user);

        await expect(authorizer.getPermissions(null, user.id)).resolves.toEqual(permissionsMap[role]);
    });

    it('should return no permissions for an unknown user', async () => {
        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);

        await expect(authorizer.getPermissions(null, UserId.generate())).resolves.toEqual(new Set());
    });
});
