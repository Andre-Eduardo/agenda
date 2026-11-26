import {mock} from 'jest-mock-extended';
import type {UnauthenticatedActor} from '../../../../domain/@shared/actor';
import {AccessDeniedException} from '../../../../domain/@shared/exceptions';
import {Email} from '../../../../domain/@shared/value-objects';
import type {EventDispatcher} from '../../../../domain/event';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {Username} from '../../../../domain/user/value-objects';
import type {EnvConfigService} from '../../../../infrastructure/config';
import {SignUpMode} from '../../../../infrastructure/config';
import type {SignUpUserDto} from '../../dtos';
import {SIGN_UP_CLOSED, SIGN_UP_INVALID_INVITE, SignUpUserService} from '../sign-up-user.service';

describe('Sign-up gating', () => {
    const userRepository = mock<UserRepository>();
    const config = mock<EnvConfigService>();
    const service = new SignUpUserService(userRepository, mock<EventDispatcher>(), config);

    const actor: UnauthenticatedActor = {userId: null, clinicId: null, clinicMemberId: null, ip: '127.0.0.1'};

    const payload = (inviteCode?: string | null): SignUpUserDto => ({
        name: 'John Doe',
        email: Email.create('john.doe@example.com'),
        username: Username.create('johndoe'),
        password: '@SecurePassword123',
        inviteCode,
    });

    function withMode(mode: SignUpMode, inviteCode?: string): void {
        Object.defineProperty(config, 'signUp', {get: () => ({mode, inviteCode}), configurable: true});
    }

    it('allows anyone when open', async () => {
        withMode(SignUpMode.OPEN);

        await expect(service.execute({actor, payload: payload()})).resolves.toMatchObject({name: 'John Doe'});
        expect(userRepository.save).toHaveBeenCalled();
    });

    it('rejects everyone when closed', async () => {
        withMode(SignUpMode.CLOSED);

        await expect(service.execute({actor, payload: payload('anything')})).rejects.toThrowWithMessage(
            AccessDeniedException,
            SIGN_UP_CLOSED
        );
        expect(userRepository.save).not.toHaveBeenCalled();
    });

    it.each([[undefined], [null], ['wrong-code'], ['secret-cod']])(
        'rejects a missing or wrong invite code (%s)',
        async (code) => {
            withMode(SignUpMode.INVITE, 'secret-code');

            await expect(service.execute({actor, payload: payload(code)})).rejects.toThrowWithMessage(
                AccessDeniedException,
                SIGN_UP_INVALID_INVITE
            );
        }
    );

    it('accepts the right invite code', async () => {
        withMode(SignUpMode.INVITE, 'secret-code');

        await expect(service.execute({actor, payload: payload('secret-code')})).resolves.toMatchObject({
            name: 'John Doe',
        });
    });
});
