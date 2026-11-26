import {mock} from 'jest-mock-extended';
import type {UnauthenticatedActor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {Email} from '../../../../domain/@shared/value-objects';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import type {PasswordResetMailer} from '../../../../domain/user/password-reset-mailer';
import {TokenScope} from '../../../../domain/user/token';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {JsonWebTokenProvider} from '../../../../infrastructure/auth/jwt';
import type {EnvConfigService} from '../../../../infrastructure/config';
import {PASSWORD_FINGERPRINT_CLAIM, RequestPasswordResetService} from '../request-password-reset.service';
import {INVALID_RESET_LINK, ResetPasswordService} from '../reset-password.service';

describe('The password reset flow', () => {
    const userRepository = mock<UserRepository>();
    const mailer = mock<PasswordResetMailer>();
    const eventDispatcher = mock<EventDispatcher>();
    const tokenProvider = new JsonWebTokenProvider(3600, 'test-secret');
    const config = mock<EnvConfigService>();

    const requestService = new RequestPasswordResetService(userRepository, tokenProvider, mailer, config);
    const resetService = new ResetPasswordService(userRepository, tokenProvider, eventDispatcher);

    const actor: UnauthenticatedActor = {userId: null, clinicId: null, clinicMemberId: null, ip: '127.0.0.1'};

    beforeEach(() => {
        Object.defineProperty(config, 'passwordReset', {
            get: () => ({tokenExpiration: 1800, webAppUrl: 'https://app.example.com'}),
            configurable: true,
        });
        mailer.send.mockResolvedValue(true);
    });

    async function requestLinkFor(user: ReturnType<typeof fakeUser>): Promise<string> {
        userRepository.findByEmail.mockResolvedValueOnce(user);
        await requestService.execute({actor, payload: {email: Email.create('john_doe@example.com')}});

        const {resetUrl} = mailer.send.mock.calls.at(-1)?.[0] ?? {resetUrl: ''};

        return new URL(resetUrl).searchParams.get('token') ?? '';
    }

    it('sends nothing for an unknown e-mail', async () => {
        userRepository.findByEmail.mockResolvedValueOnce(null);

        await expect(
            requestService.execute({actor, payload: {email: Email.create('nobody@example.com')}})
        ).resolves.toBeUndefined();
        expect(mailer.send).not.toHaveBeenCalled();
    });

    it('e-mails a recovery link to a known account', async () => {
        const user = fakeUser();
        const token = await requestLinkFor(user);

        expect(mailer.send).toHaveBeenCalledWith({
            to: 'john_doe@example.com',
            name: 'John Doe',
            resetUrl: expect.stringMatching(/^https:\/\/app\.example\.com\/auth\/reset-password\?token=/),
            expiresInMinutes: 30,
        });

        const parsed = tokenProvider.parse(token);

        expect(parsed.scope).toEqual([TokenScope.RECOVERY]);
        expect(parsed.metadata?.[PASSWORD_FINGERPRINT_CLAIM]).toBe(user.password.fingerprint());
    });

    it('changes the password with a valid link, only once', async () => {
        const user = fakeUser();
        const token = await requestLinkFor(user);

        userRepository.findById.mockResolvedValue(user);

        await resetService.execute({actor, payload: {token, newPassword: 'N3w.Passw0rd!'}});

        expect(userRepository.save).toHaveBeenCalledWith(user);
        await expect(user.password.verify('N3w.Passw0rd!')).resolves.toBe(true);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith({...actor, userId: user.id}, user);

        // The fingerprint changed with the password, so the same link no longer works.
        await expect(
            resetService.execute({actor, payload: {token, newPassword: 'An0ther.Pass!'}})
        ).rejects.toThrowWithMessage(PreconditionException, INVALID_RESET_LINK);
    });

    it.each([
        ['a malformed token', () => 'not-a-token'],
        ['an auth token', () => tokenProvider.issue(UserId.generate(), {scope: [TokenScope.AUTH]}).toString()],
        [
            'a token signed with another secret',
            () =>
                new JsonWebTokenProvider(3600, 'other-secret')
                    .issue(UserId.generate(), {scope: [TokenScope.RECOVERY]})
                    .toString(),
        ],
    ])('rejects %s', async (_, makeToken) => {
        await expect(
            resetService.execute({actor, payload: {token: makeToken(), newPassword: 'N3w.Passw0rd!'}})
        ).rejects.toThrowWithMessage(PreconditionException, INVALID_RESET_LINK);
        expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a link for a deleted user', async () => {
        const token = await requestLinkFor(fakeUser());

        userRepository.findById.mockResolvedValueOnce(null);

        await expect(
            resetService.execute({actor, payload: {token, newPassword: 'N3w.Passw0rd!'}})
        ).rejects.toThrowWithMessage(PreconditionException, INVALID_RESET_LINK);
    });
});
