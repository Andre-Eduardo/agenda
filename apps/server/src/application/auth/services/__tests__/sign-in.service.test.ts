import {mock} from 'jest-mock-extended';
import type {UnauthenticatedActor} from '../../../../domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '../../../../domain/@shared/exceptions';
import {GlobalRole} from '../../../../domain/auth';
import type {ClinicMemberRepository} from '../../../../domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '../../../../domain/clinic-member/entities';
import {ClinicId} from '../../../../domain/clinic/entities';
import type {EventDispatcher} from '../../../../domain/event';
import type {User} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {UserSignedInEvent} from '../../../../domain/user/events';
import type {TokenClinicMember, TokenProvider} from '../../../../domain/user/token';
import {TokenScope} from '../../../../domain/user/token';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../../../domain/user/value-objects';
import {JsonWebToken} from '../../../../infrastructure/auth/jwt';
import type {SignInDto} from '../../dtos';
import {SignInService} from '../index';

function memberOf(user: User, id: ClinicMemberId): ClinicMember {
    return new ClinicMember({
        id,
        clinicId: ClinicId.generate(),
        userId: user.id,
        roles: [ClinicMemberRole.OWNER],
        displayName: null,
        color: null,
        isActive: true,
        invitedByMemberId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        deletedAt: null,
    });
}

async function existingUserWith(clinicMembers: ClinicMemberId[], globalRole = GlobalRole.NONE): Promise<User> {
    return fakeUser({
        username: Username.create('johndoe'),
        password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        globalRole,
        clinicMembers,
    });
}

describe('A sign-in service', () => {
    const userRepository = mock<UserRepository>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const tokenProvider = mock<TokenProvider>();
    const signInService = new SignInService(userRepository, clinicMemberRepository, tokenProvider, eventDispatcher);

    const actor: UnauthenticatedActor = {
        userId: null,
        clinicId: null,
        clinicMemberId: null,
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function tokenFor(user: User, clinicMembers: TokenClinicMember[]): JsonWebToken {
        return JsonWebToken.signed(
            {
                userId: user.id,
                clinicMemberId: null,
                clinicMembers,
                scope: [TokenScope.AUTH],
                issueTime: now,
                expirationTime: new Date(now.getTime() + 3600 * 1000),
            },
            'secret'
        );
    }

    function expectSignedIn(user: User, payload: SignInDto): void {
        expect(user.signIn).toHaveBeenCalledWith(payload.password);

        expect(user.events).toHaveLength(1);
        expect(user.events[0]).toBeInstanceOf(UserSignedInEvent);
        expect(user.events).toEqual([
            {
                type: UserSignedInEvent.type,
                timestamp: now,
                userId: user.id,
            },
        ]);

        expect(eventDispatcher.dispatch).toHaveBeenCalledWith({...actor, userId: user.id}, user);
    }

    it('should sign in to a user', async () => {
        const memberId = ClinicMemberId.generate();
        const existingUser = await existingUserWith([memberId], GlobalRole.OWNER);
        const member = memberOf(existingUser, memberId);

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const clinicMembers = [{clinicMemberId: member.id, clinicId: member.clinicId}];
        const token = tokenFor(existingUser, clinicMembers);

        jest.spyOn(existingUser, 'signIn');
        userRepository.findByUsername.mockResolvedValueOnce(existingUser);
        clinicMemberRepository.findById.mockResolvedValueOnce(member);
        tokenProvider.issue.mockReturnValue(token);

        await expect(signInService.execute({actor, payload})).resolves.toEqual({
            token,
            clinicMemberId: memberId,
        });

        expect(userRepository.findByUsername).toHaveBeenCalledWith(payload.username);
        expect(clinicMemberRepository.findById).toHaveBeenCalledWith(memberId);
        expect(tokenProvider.issue).toHaveBeenCalledWith(existingUser.id, {
            scope: [TokenScope.AUTH],
            clinicMembers,
            clinicMemberId: memberId,
        });

        expectSignedIn(existingUser, payload);
    });

    it('should keep support accesses out of the token so a support user enters clinics explicitly', async () => {
        const supportMemberId = ClinicMemberId.generate();
        const existingUser = await existingUserWith([supportMemberId], GlobalRole.SUPPORT);
        const supportMember = ClinicMember.createSupportAccess({
            clinicId: ClinicId.generate(),
            userId: existingUser.id,
            displayName: 'John Doe (suporte)',
        });

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
            clinicMemberId: supportMember.id,
        };

        const token = tokenFor(existingUser, []);

        userRepository.findByUsername.mockResolvedValueOnce(existingUser);
        clinicMemberRepository.findById.mockResolvedValueOnce(supportMember);
        tokenProvider.issue.mockReturnValue(token);

        await expect(signInService.execute({actor, payload})).resolves.toEqual({token, clinicMemberId: undefined});

        expect(tokenProvider.issue).toHaveBeenCalledWith(existingUser.id, {
            scope: [TokenScope.AUTH],
            clinicMembers: [],
            clinicMemberId: undefined,
        });
    });

    it('should select the clinic member the user is requesting for sign-in', async () => {
        const firstMemberId = ClinicMemberId.generate();
        const requestedMemberId = ClinicMemberId.generate();
        const existingUser = await existingUserWith([firstMemberId, requestedMemberId]);
        const firstMember = memberOf(existingUser, firstMemberId);
        const requestedMember = memberOf(existingUser, requestedMemberId);

        const payload: SignInDto = {
            clinicMemberId: requestedMemberId,
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const token = tokenFor(existingUser, []);

        jest.spyOn(existingUser, 'signIn');
        userRepository.findByUsername.mockResolvedValueOnce(existingUser);
        clinicMemberRepository.findById.mockResolvedValueOnce(firstMember).mockResolvedValueOnce(requestedMember);
        tokenProvider.issue.mockReturnValue(token);

        await expect(signInService.execute({actor, payload})).resolves.toEqual({
            token,
            clinicMemberId: requestedMemberId,
        });

        expect(tokenProvider.issue).toHaveBeenCalledWith(existingUser.id, {
            scope: [TokenScope.AUTH],
            clinicMembers: [
                {clinicMemberId: firstMemberId, clinicId: firstMember.clinicId},
                {clinicMemberId: requestedMemberId, clinicId: requestedMember.clinicId},
            ],
            clinicMemberId: requestedMemberId,
        });

        expectSignedIn(existingUser, payload);
    });

    it('should select no clinic member for owners with no clinic members', async () => {
        const existingUser = await existingUserWith([], GlobalRole.OWNER);

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const token = tokenFor(existingUser, []);

        jest.spyOn(existingUser, 'signIn');
        userRepository.findByUsername.mockResolvedValueOnce(existingUser);
        tokenProvider.issue.mockReturnValue(token);

        await expect(signInService.execute({actor, payload})).resolves.toEqual({
            token,
            clinicMemberId: undefined,
        });

        expect(clinicMemberRepository.findById).not.toHaveBeenCalled();
        expect(tokenProvider.issue).toHaveBeenCalledWith(existingUser.id, {
            scope: [TokenScope.AUTH],
            clinicMembers: [],
            clinicMemberId: undefined,
        });

        expectSignedIn(existingUser, payload);
    });

    it.each([ClinicMemberId.generate(), null, undefined])(
        'should select the first clinic member the user has access to (requested: %s)',
        async (clinicMemberId) => {
            const memberIds = [ClinicMemberId.generate(), ClinicMemberId.generate()];
            const existingUser = await existingUserWith(memberIds);

            const payload: SignInDto = {
                clinicMemberId,
                username: Username.create('johndoe'),
                password: '@SecurePassword123',
            };

            const token = tokenFor(existingUser, []);

            jest.spyOn(existingUser, 'signIn');
            userRepository.findByUsername.mockResolvedValueOnce(existingUser);
            clinicMemberRepository.findById.mockImplementation((id) => Promise.resolve(memberOf(existingUser, id)));
            tokenProvider.issue.mockReturnValue(token);

            await expect(signInService.execute({actor, payload})).resolves.toEqual({
                token,
                clinicMemberId: memberIds[0],
            });

            expectSignedIn(existingUser, payload);
        }
    );

    it('should drop clinic members that no longer exist and select an existing one', async () => {
        const deletedMemberId = ClinicMemberId.generate();
        const memberId = ClinicMemberId.generate();
        const existingUser = await existingUserWith([deletedMemberId, memberId]);
        const member = memberOf(existingUser, memberId);

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const token = tokenFor(existingUser, []);

        jest.spyOn(existingUser, 'signIn');
        userRepository.findByUsername.mockResolvedValueOnce(existingUser);
        clinicMemberRepository.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(member);
        tokenProvider.issue.mockReturnValue(token);

        await expect(signInService.execute({actor, payload})).resolves.toEqual({
            token,
            clinicMemberId: memberId,
        });

        expect(tokenProvider.issue).toHaveBeenCalledWith(existingUser.id, {
            scope: [TokenScope.AUTH],
            clinicMembers: [{clinicMemberId: memberId, clinicId: member.clinicId}],
            clinicMemberId: memberId,
        });

        expectSignedIn(existingUser, payload);
    });

    it('should not select a requested clinic member that no longer exists', async () => {
        const deletedMemberId = ClinicMemberId.generate();
        const memberId = ClinicMemberId.generate();
        const existingUser = await existingUserWith([deletedMemberId, memberId]);
        const member = memberOf(existingUser, memberId);

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
            clinicMemberId: deletedMemberId,
        };

        const token = tokenFor(existingUser, []);

        jest.spyOn(existingUser, 'signIn');
        userRepository.findByUsername.mockResolvedValueOnce(existingUser);
        clinicMemberRepository.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(member);
        tokenProvider.issue.mockReturnValue(token);

        await expect(signInService.execute({actor, payload})).resolves.toEqual({
            token,
            clinicMemberId: memberId,
        });

        expect(tokenProvider.issue).toHaveBeenCalledWith(existingUser.id, {
            scope: [TokenScope.AUTH],
            clinicMembers: [{clinicMemberId: memberId, clinicId: member.clinicId}],
            clinicMemberId: memberId,
        });

        expectSignedIn(existingUser, payload);
    });

    it('should fail to sign in an unknown user', async () => {
        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        userRepository.findByUsername.mockResolvedValueOnce(null);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(signInService.execute({actor, payload}));

        await expectation.rejects.toThrowWithMessage(
            AccessDeniedException,
            `No user found with username "${payload.username}".`
        );
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.UNKNOWN_USER]);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to sign in a regular user without access to any clinic member', async () => {
        const existingUser = await existingUserWith([]);

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        userRepository.findByUsername.mockResolvedValueOnce(existingUser);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(signInService.execute({actor, payload}));

        await expectation.rejects.toThrowWithMessage(
            AccessDeniedException,
            `The user "${payload.username}" is not allowed to access the system.`
        );
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.NOT_ALLOWED]);

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to sign in with an incorrect password', async () => {
        const existingUser = await existingUserWith([ClinicMemberId.generate()]);

        const payload: SignInDto = {
            username: Username.create('johndoe'),
            password: 'wrong-password',
        };

        userRepository.findByUsername.mockResolvedValueOnce(existingUser);

        // eslint-disable-next-line jest/valid-expect -- To allow multiple assertions
        const expectation = expect(signInService.execute({actor, payload}));

        await expectation.rejects.toThrowWithMessage(AccessDeniedException, 'Incorrect password.');
        await expectation.rejects.toContainEntry(['reason', AccessDeniedReason.BAD_CREDENTIALS]);

        expect(tokenProvider.issue).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
