import type {Response} from 'express';
import {mock, mockDeep} from 'jest-mock-extended';
import type {Actor, UnauthenticatedActor} from '../../../../domain/@shared/actor';
import {Email} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import {TokenScope} from '../../../../domain/user/token';
import {Username} from '../../../../domain/user/value-objects';
import {JsonWebToken} from '../../../../infrastructure/auth/jwt';
import type {SignInService, SignOutService} from '../../services';
import {AuthController} from '../auth.controller';

describe('A auth controller', () => {
    const signInServiceMock = mock<SignInService>();
    const signOutServiceMock = mock<SignOutService>();
    const authController = new AuthController(signInServiceMock, signOutServiceMock);

    describe('when signing in a user', () => {
        it('should repass the responsibility to the right service', async () => {
            const response = mockDeep<Response>();
            const companyId = CompanyId.generate();

            const actor: UnauthenticatedActor = {
                userId: null,
                ip: '127.0.0.1',
            };

            const payload = {
                firstName: 'John',
                lastName: 'Doe',
                email: Email.create('john.doe@example.com'),
                username: Username.create('johndoe'),
                password: '@SecurePassword123',
            };

            const token = JsonWebToken.signed(
                {
                    userId: UserId.generate(),
                    companies: [companyId],
                    issueTime: new Date(),
                    expirationTime: new Date(),
                    scope: [TokenScope.AUTH],
                },
                'secret'
            );

            jest.spyOn(signInServiceMock, 'execute').mockResolvedValue({
                token,
                companyId,
            });

            await authController.signIn(actor, payload, response);

            expect(signInServiceMock.execute).toHaveBeenCalledWith({actor, payload});

            expect(response.actions.setToken).toHaveBeenCalledWith(token);
        });
    });

    describe('when signing out a user', () => {
        it('should repass the responsibility to the right service', async () => {
            const response = mockDeep<Response>();

            const actor: Actor = {
                userId: UserId.generate(),
                ip: '127.0.0.1',
            };

            await authController.signOut(actor, response);

            expect(signOutServiceMock.execute).toHaveBeenCalledWith({actor, payload: undefined});

            expect(response.actions.setToken).toHaveBeenCalledWith(null);
        });
    });
});
