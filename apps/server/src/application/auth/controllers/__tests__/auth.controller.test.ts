import type {Response} from 'express';
import {mock, mockDeep} from 'jest-mock-extended';
import type {Actor, UnauthenticatedActor} from '../../../../domain/@shared/actor';
import {Email} from '../../../../domain/@shared/value-objects';
import {ClinicMemberId} from '../../../../domain/clinic-member/entities';
import {ClinicId} from '../../../../domain/clinic/entities';
import {UserId} from '../../../../domain/user/entities';
import {TokenScope} from '../../../../domain/user/token';
import {Username} from '../../../../domain/user/value-objects';
import {JsonWebToken} from '../../../../infrastructure/auth/jwt';
import type {RequestPasswordResetDto, ResetPasswordDto, SignInDto} from '../../dtos';
import type {RequestPasswordResetService, ResetPasswordService, SignInService, SignOutService} from '../../services';
import {AuthController} from '../auth.controller';

describe('A auth controller', () => {
    const signInServiceMock = mock<SignInService>();
    const signOutServiceMock = mock<SignOutService>();
    const requestPasswordResetServiceMock = mock<RequestPasswordResetService>();
    const resetPasswordServiceMock = mock<ResetPasswordService>();
    const authController = new AuthController(
        signInServiceMock,
        signOutServiceMock,
        requestPasswordResetServiceMock,
        resetPasswordServiceMock
    );

    const unauthenticatedActor: UnauthenticatedActor = {
        userId: null,
        clinicId: null,
        clinicMemberId: null,
        ip: '127.0.0.1',
    };

    describe('when signing in a user', () => {
        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const token = JsonWebToken.signed(
            {
                userId: UserId.generate(),
                clinicMemberId: null,
                clinicMembers: [],
                issueTime: new Date(),
                expirationTime: new Date(),
                scope: [TokenScope.AUTH],
            },
            'secret'
        );

        it('should repass the responsibility to the right service', async () => {
            const response = mockDeep<Response>();
            const clinicMemberId = ClinicMemberId.generate();

            signInServiceMock.execute.mockResolvedValue({token, clinicMemberId});

            await authController.signIn(unauthenticatedActor, payload, response);

            expect(signInServiceMock.execute).toHaveBeenCalledWith({actor: unauthenticatedActor, payload});

            expect(response.actions.setToken).toHaveBeenCalledWith(token);
            expect(response.actions.setClinicMember).toHaveBeenCalledWith(clinicMemberId);
        });

        it('should not set the clinic member when none is selected', async () => {
            const response = mockDeep<Response>();

            signInServiceMock.execute.mockResolvedValue({token, clinicMemberId: undefined});

            await authController.signIn(unauthenticatedActor, payload, response);

            expect(response.actions.setToken).toHaveBeenCalledWith(token);
            expect(response.actions.setClinicMember).not.toHaveBeenCalled();
        });
    });

    describe('when signing out a user', () => {
        it('should repass the responsibility to the right service', async () => {
            const response = mockDeep<Response>();

            const actor: Actor = {
                userId: UserId.generate(),
                clinicId: ClinicId.generate(),
                clinicMemberId: ClinicMemberId.generate(),
                ip: '127.0.0.1',
            };

            await authController.signOut(actor, response);

            expect(signOutServiceMock.execute).toHaveBeenCalledWith({actor, payload: undefined});

            expect(response.actions.setToken).toHaveBeenCalledWith(null);
        });
    });

    describe('when requesting a password reset', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: RequestPasswordResetDto = {email: Email.create('john.doe@example.com')};

            await authController.requestPasswordReset(unauthenticatedActor, payload);

            expect(requestPasswordResetServiceMock.execute).toHaveBeenCalledWith({
                actor: unauthenticatedActor,
                payload,
            });
        });
    });

    describe('when resetting a password', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: ResetPasswordDto = {token: 'reset-token', newPassword: '@SecurePassword123'};

            await authController.resetPassword(unauthenticatedActor, payload);

            expect(resetPasswordServiceMock.execute).toHaveBeenCalledWith({actor: unauthenticatedActor, payload});
        });
    });
});
