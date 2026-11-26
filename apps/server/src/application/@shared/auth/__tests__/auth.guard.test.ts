import type {ExecutionContext} from '@nestjs/common';
import type {HttpArgumentsHost} from '@nestjs/common/interfaces';
import type {Reflector} from '@nestjs/core';
import type {Request} from 'express';
import {mock, mockDeep} from 'jest-mock-extended';
import {
    AccessDeniedException,
    AccessDeniedReason,
    UnauthenticatedException,
} from '../../../../domain/@shared/exceptions';
import type {AuditLogRepository} from '../../../../domain/audit/audit-log.repository';
import {GlobalRole, RoomPermission} from '../../../../domain/auth';
import type {Authorizer} from '../../../../domain/auth/authorizer';
import type {ClinicMemberRepository} from '../../../../domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '../../../../domain/clinic-member/entities';
import {ClinicId} from '../../../../domain/clinic/entities';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {TokenScope} from '../../../../domain/user/token';
import type {TokenClinicMember} from '../../../../domain/user/token';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {JsonWebToken, JsonWebTokenProvider} from '../../../../infrastructure/auth/jwt';
import {AuthGuard} from '../auth.guard';

class RoomController {
    remove(): void {}
}

function fakeMembership(): TokenClinicMember {
    return {clinicMemberId: ClinicMemberId.generate(), clinicId: ClinicId.generate()};
}

function memberFor(userId: UserId, membership: TokenClinicMember, isActive = true): ClinicMember {
    return new ClinicMember({
        id: membership.clinicMemberId,
        clinicId: membership.clinicId,
        userId,
        roles: [ClinicMemberRole.OWNER],
        displayName: null,
        color: null,
        isActive,
        invitedByMemberId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        deletedAt: null,
    });
}

function setup(signedCookies: Record<string, string | null> | undefined, params: Record<string, string> = {}) {
    const context = mock<ExecutionContext>();
    const request = mock<Request>({signedCookies, params, method: 'DELETE'});
    const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

    httpArgumentsHost.getRequest.mockReturnValueOnce(request);
    context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);

    return {context, request};
}

describe('An auth guard', () => {
    const authCookie = 'authCookie';
    const clinicMemberCookie = 'clinicMemberCookie';
    const secret = 'secret';
    const tokenProvider = new JsonWebTokenProvider(60, secret);
    const authorizer = mock<Authorizer>();
    const reflector = mock<Reflector>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const auditLogRepository = mock<AuditLogRepository>();
    const guard = new AuthGuard(
        authCookie,
        clinicMemberCookie,
        tokenProvider,
        authorizer,
        reflector,
        clinicMemberRepository,
        auditLogRepository
    );

    it('should allow access to public routes', async () => {
        const context = mock<ExecutionContext>();

        reflector.getAllAndOverride.mockReturnValueOnce(true);

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should allow access to valid tokens', async () => {
        const membership = fakeMembership();
        const userId = UserId.generate();
        const token = tokenProvider.issue(userId, {scope: [TokenScope.AUTH], clinicMembers: [membership]});
        const {context, request} = setup({
            [authCookie]: token.toString(),
            [clinicMemberCookie]: membership.clinicMemberId.toString(),
        });

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);
        clinicMemberRepository.findById.mockResolvedValueOnce(memberFor(userId, membership));

        jest.spyOn(tokenProvider, 'validate');

        await expect(guard.canActivate(context)).resolves.toBe(true);

        expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
        expect(tokenProvider.validate).toHaveBeenCalledWith(token);
        expect(clinicMemberRepository.findById).toHaveBeenCalledWith(membership.clinicMemberId);

        expect(request.actor).toMatchObject({
            userId: token.userId,
            clinicId: membership.clinicId,
            clinicMemberId: membership.clinicMemberId,
        });
    });

    it('should allow access to authorized routes', async () => {
        const membership = fakeMembership();
        const userId = UserId.generate();
        const token = tokenProvider.issue(userId, {scope: [TokenScope.AUTH], clinicMembers: [membership]});
        const {context, request} = setup({
            [authCookie]: token.toString(),
            [clinicMemberCookie]: membership.clinicMemberId.toString(),
        });

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);
        reflector.get.mockReturnValueOnce([RoomPermission.DELETE]);
        clinicMemberRepository.findById.mockResolvedValueOnce(memberFor(userId, membership));
        authorizer.validate.mockResolvedValueOnce(true);

        await expect(guard.canActivate(context)).resolves.toBe(true);

        expect(request.actor).toMatchObject({userId: token.userId});

        expect(authorizer.validate).toHaveBeenCalledTimes(1);
        expect(authorizer.validate).toHaveBeenCalledWith(
            membership.clinicMemberId,
            token.userId,
            RoomPermission.DELETE
        );
    });

    it('should bypass the clinic member validation', async () => {
        const token = tokenProvider.issue(UserId.generate(), {scope: [TokenScope.AUTH]});
        const {context, request} = setup({[authCookie]: token.toString(), [clinicMemberCookie]: null});

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(true);

        await expect(guard.canActivate(context)).resolves.toBe(true);

        expect(clinicMemberRepository.findById).not.toHaveBeenCalled();
        expect(request.actor).toMatchObject({userId: token.userId, clinicId: null, clinicMemberId: null});
    });

    it('should ignore malformed clinic member cookies when bypassing the clinic member validation', async () => {
        const token = tokenProvider.issue(UserId.generate(), {scope: [TokenScope.AUTH]});
        const {context, request} = setup({[authCookie]: token.toString(), [clinicMemberCookie]: 'invalid'});

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(true);

        await expect(guard.canActivate(context)).resolves.toBe(true);

        expect(request.actor).toMatchObject({userId: token.userId, clinicMemberId: null});
    });

    it('should deny access when no token is present', async () => {
        const {context} = setup({[authCookie]: null});

        reflector.getAllAndOverride.mockReturnValueOnce(false);

        jest.spyOn(tokenProvider, 'validate');

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
            UnauthenticatedException,
            'Token not found or malformed.'
        );

        expect(tokenProvider.validate).not.toHaveBeenCalled();
    });

    it('should deny access when the request has no signed cookies', async () => {
        const {context} = setup(undefined);

        reflector.getAllAndOverride.mockReturnValueOnce(false);

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
            UnauthenticatedException,
            'Token not found or malformed.'
        );
    });

    it('should deny access to malformed tokens', async () => {
        const {context} = setup({[authCookie]: 'invalid'});

        reflector.getAllAndOverride.mockReturnValueOnce(false);

        jest.spyOn(tokenProvider, 'validate');

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
            UnauthenticatedException,
            'Token not found or malformed.'
        );

        expect(tokenProvider.validate).not.toHaveBeenCalled();
    });

    it('should deny access to expired tokens', async () => {
        const token = JsonWebToken.signed(
            {
                userId: UserId.generate(),
                clinicMemberId: null,
                clinicMembers: [fakeMembership()],
                issueTime: new Date(2000),
                expirationTime: new Date(1000),
                scope: [TokenScope.AUTH],
            },
            secret
        );
        const {context} = setup({[authCookie]: token.toString()});

        reflector.getAllAndOverride.mockReturnValueOnce(false);

        jest.spyOn(tokenProvider, 'validate');

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(UnauthenticatedException, 'Invalid token.');

        expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
        expect(tokenProvider.validate).toHaveBeenCalledWith(token);
    });

    it('should deny access to tokens with invalid signatures', async () => {
        const token = JsonWebToken.signed(
            {
                userId: UserId.generate(),
                clinicMemberId: null,
                clinicMembers: [fakeMembership()],
                issueTime: new Date(2000),
                expirationTime: new Date(Date.now() + 10_000),
                scope: [TokenScope.AUTH],
            },
            'invalid-secret'
        );
        const {context} = setup({[authCookie]: token.toString()});

        reflector.getAllAndOverride.mockReturnValueOnce(false);

        jest.spyOn(tokenProvider, 'validate');

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(UnauthenticatedException, 'Invalid token.');

        expect(tokenProvider.validate).toHaveBeenCalledTimes(1);
        expect(tokenProvider.validate).toHaveBeenCalledWith(token);
    });

    it('should deny access to tokens with invalid scopes', async () => {
        const token = tokenProvider.issue(UserId.generate(), {scope: [TokenScope.EMAIL_VERIFICATION]});
        const {context} = setup({[authCookie]: token.toString()});

        reflector.getAllAndOverride.mockReturnValueOnce(false);

        jest.spyOn(tokenProvider, 'validate');

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
            UnauthenticatedException,
            'Token does not have the required scope.'
        );

        expect(tokenProvider.validate).not.toHaveBeenCalled();
    });

    it('should deny access when no clinic member is present', async () => {
        const token = tokenProvider.issue(UserId.generate(), {
            scope: [TokenScope.AUTH],
            clinicMembers: [fakeMembership()],
        });
        const {context} = setup({[authCookie]: token.toString(), [clinicMemberCookie]: null});

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(guard.canActivate(context));

        await expectation.rejects.toThrowWithMessage(
            AccessDeniedException,
            'Token does not have access to the requested clinic member.'
        );
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.NOT_ALLOWED]);
    });

    it('should deny access when the token does not have access to the requested clinic member', async () => {
        const token = tokenProvider.issue(UserId.generate(), {
            scope: [TokenScope.AUTH],
            clinicMembers: [fakeMembership()],
        });
        const {context} = setup({
            [authCookie]: token.toString(),
            [clinicMemberCookie]: ClinicMemberId.generate().toString(),
        });

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(guard.canActivate(context));

        await expectation.rejects.toThrowWithMessage(
            AccessDeniedException,
            'Token does not have access to the requested clinic member.'
        );
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.NOT_ALLOWED]);
    });

    it.each([
        ['does not exist', () => null],
        ['is inactive', (userId: UserId, membership: TokenClinicMember) => memberFor(userId, membership, false)],
        [
            'belongs to another user',
            (_: UserId, membership: TokenClinicMember) => memberFor(UserId.generate(), membership),
        ],
        [
            'belongs to another clinic',
            (userId: UserId, membership: TokenClinicMember) =>
                memberFor(userId, {clinicMemberId: membership.clinicMemberId, clinicId: ClinicId.generate()}),
        ],
    ])('should deny access when the clinic member %s', async (_, member) => {
        const membership = fakeMembership();
        const userId = UserId.generate();
        const token = tokenProvider.issue(userId, {scope: [TokenScope.AUTH], clinicMembers: [membership]});
        const {context} = setup({
            [authCookie]: token.toString(),
            [clinicMemberCookie]: membership.clinicMemberId.toString(),
        });

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);
        clinicMemberRepository.findById.mockResolvedValueOnce(member(userId, membership));

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(guard.canActivate(context));

        await expectation.rejects.toThrowWithMessage(AccessDeniedException, 'Clinic membership is no longer active.');
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.NOT_ALLOWED]);
    });

    it('should deny access to unauthorized routes and audit the denial', async () => {
        const membership = fakeMembership();
        const userId = UserId.generate();
        const token = tokenProvider.issue(userId, {scope: [TokenScope.AUTH], clinicMembers: [membership]});
        const {context} = setup(
            {
                [authCookie]: token.toString(),
                [clinicMemberCookie]: membership.clinicMemberId.toString(),
            },
            {id: 'room-1'}
        );

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);
        reflector.get.mockReturnValueOnce([RoomPermission.DELETE]);
        clinicMemberRepository.findById.mockResolvedValueOnce(memberFor(userId, membership));
        authorizer.validate.mockResolvedValueOnce(false);
        authorizer.denialReason.mockResolvedValueOnce(AccessDeniedReason.INSUFFICIENT_PERMISSIONS);
        context.getClass.mockReturnValue(RoomController);
        context.getHandler.mockReturnValue(RoomController.prototype.remove);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(guard.canActivate(context));

        await expectation.rejects.toThrowWithMessage(
            AccessDeniedException,
            `The user "${token.userId}" does not have the required permissions: [${RoomPermission.DELETE}]`
        );
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.INSUFFICIENT_PERMISSIONS]);

        expect(authorizer.validate).toHaveBeenCalledTimes(1);
        expect(authorizer.validate).toHaveBeenCalledWith(
            membership.clinicMemberId,
            token.userId,
            RoomPermission.DELETE
        );
        expect(authorizer.denialReason).toHaveBeenCalledWith(membership.clinicMemberId, token.userId, [
            RoomPermission.DELETE,
        ]);
        expect(auditLogRepository.append).toHaveBeenCalledWith(
            expect.objectContaining({
                clinicId: membership.clinicId.toString(),
                actorUserId: userId.toString(),
                actorMemberId: membership.clinicMemberId.toString(),
                resource: 'RoomController',
                resourceId: 'room-1',
                action: 'DELETE:remove',
                result: 'DENIED',
                statusCode: 403,
            })
        );
    });

    it('should deny access to unauthorized routes without auditing when there is no clinic member', async () => {
        const token = tokenProvider.issue(UserId.generate(), {scope: [TokenScope.AUTH]});
        const {context} = setup({[authCookie]: token.toString()});

        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(true);
        reflector.get.mockReturnValueOnce([RoomPermission.DELETE]);
        authorizer.validate.mockResolvedValueOnce(false);
        authorizer.denialReason.mockResolvedValueOnce(AccessDeniedReason.NOT_ALLOWED);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(guard.canActivate(context));

        await expectation.rejects.toThrow(AccessDeniedException);
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.NOT_ALLOWED]);

        expect(authorizer.validate).toHaveBeenCalledWith(null, token.userId, RoomPermission.DELETE);
        expect(auditLogRepository.append).not.toHaveBeenCalled();
    });
});

describe('An auth guard with global support access', () => {
    const authCookie = 'authCookie';
    const clinicMemberCookie = 'clinicMemberCookie';
    const tokenProvider = new JsonWebTokenProvider(60, 'secret');
    const authorizer = mock<Authorizer>();
    const reflector = mock<Reflector>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const auditLogRepository = mock<AuditLogRepository>();
    const userRepository = mock<UserRepository>();
    const guard = new AuthGuard(
        authCookie,
        clinicMemberCookie,
        tokenProvider,
        authorizer,
        reflector,
        clinicMemberRepository,
        auditLogRepository,
        userRepository
    );

    function supportSetup(method: string, globalRole: GlobalRole) {
        const user = fakeUser({globalRole, clinicMembers: []});
        // Support accesses never go in the token.
        const token = tokenProvider.issue(user.id, {scope: [TokenScope.AUTH], clinicMembers: []});
        const member = ClinicMember.createSupportAccess({
            clinicId: ClinicId.generate(),
            userId: user.id,
            displayName: 'John Doe (suporte)',
        });
        const context = mock<ExecutionContext>();
        const request = mock<Request>({
            signedCookies: {[authCookie]: token.toString(), [clinicMemberCookie]: member.id.toString()},
            params: {},
            method,
        });
        const httpArgumentsHost = mockDeep<HttpArgumentsHost>();

        httpArgumentsHost.getRequest.mockReturnValueOnce(request);
        context.switchToHttp.mockReturnValueOnce(httpArgumentsHost);
        context.getClass.mockReturnValue(RoomController);
        context.getHandler.mockReturnValue(RoomController.prototype.remove);
        reflector.getAllAndOverride.mockReturnValueOnce(false).mockReturnValueOnce(false);
        clinicMemberRepository.findById.mockResolvedValue(member);
        userRepository.findById.mockResolvedValue(user);

        return {context, request, member, user};
    }

    it('should let a support user read inside a clinic they are not an employee of', async () => {
        const {context, request, member, user} = supportSetup('GET', GlobalRole.SUPPORT);

        reflector.get.mockReturnValueOnce(undefined);

        await expect(guard.canActivate(context)).resolves.toBe(true);

        expect(request.actor).toMatchObject({
            userId: user.id,
            clinicId: member.clinicId,
            clinicMemberId: member.id,
        });
    });

    it('should refuse the support access once the user lost the global role', async () => {
        const {context} = supportSetup('GET', GlobalRole.NONE);

        await expect(guard.canActivate(context)).rejects.toThrowWithMessage(
            AccessDeniedException,
            'Token does not have access to the requested clinic member.'
        );
    });

    it('should refuse the support access of another user', async () => {
        const {context} = supportSetup('GET', GlobalRole.SUPPORT);
        const otherUsersAccess = ClinicMember.createSupportAccess({
            clinicId: ClinicId.generate(),
            userId: UserId.generate(),
            displayName: 'Other (suporte)',
        });

        clinicMemberRepository.findById.mockReset();
        clinicMemberRepository.findById.mockResolvedValue(otherUsersAccess);

        await expect(guard.canActivate(context)).rejects.toThrow(AccessDeniedException);
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
        'should block %s for a support user and record the denial in the audit log',
        async (method) => {
            const {context, member, user} = supportSetup(method, GlobalRole.SUPPORT);

            // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
            const expectation = expect(guard.canActivate(context));

            await expectation.rejects.toThrowWithMessage(AccessDeniedException, 'Support access is read-only.');
            await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.INSUFFICIENT_PERMISSIONS]);

            expect(auditLogRepository.append).toHaveBeenCalledWith(
                expect.objectContaining({
                    clinicId: member.clinicId.toString(),
                    actorUserId: user.id.toString(),
                    actorMemberId: member.id.toString(),
                    result: 'DENIED',
                    statusCode: 403,
                })
            );
            expect(authorizer.validate).not.toHaveBeenCalled();
        }
    );

    it('should let a super admin change data through the support access', async () => {
        const {context} = supportSetup('DELETE', GlobalRole.SUPER_ADMIN);

        reflector.get.mockReturnValueOnce([RoomPermission.DELETE]);
        authorizer.validate.mockResolvedValueOnce(true);

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });
});
