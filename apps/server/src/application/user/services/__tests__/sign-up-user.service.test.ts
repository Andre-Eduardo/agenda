import {mock} from 'jest-mock-extended';
import type {UnauthenticatedActor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {Email} from '../../../../domain/@shared/value-objects';
import type {EventDispatcher} from '../../../../domain/event';
import {User} from '../../../../domain/user/entities';
import {UserSignedUpEvent} from '../../../../domain/user/events';
import {DuplicateEmailException, DuplicateUsernameException} from '../../../../domain/user/user.exceptions';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {Username} from '../../../../domain/user/value-objects';
import type {EnvConfigService} from '../../../../infrastructure/config';
import {SignUpMode} from '../../../../infrastructure/config';
import type {SignUpUserDto} from '../../dtos';
import {UserDto} from '../../dtos';
import {SignUpUserService} from '../index';

describe('A sign-up-user service', () => {
    const userRepository = mock<UserRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const config = mock<EnvConfigService>();
    const createUserService = new SignUpUserService(userRepository, eventDispatcher, config);

    const actor: UnauthenticatedActor = {
        userId: null,
        clinicId: null,
        clinicMemberId: null,
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
        Object.defineProperty(config, 'signUp', {
            get: () => ({mode: SignUpMode.OPEN, inviteCode: undefined}),
            configurable: true,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a user', async () => {
        const payload: SignUpUserDto = {
            name: 'John Doe',
            email: Email.create('john.doe@example.com'),
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const user = await User.signUp(payload);

        jest.spyOn(User, 'signUp').mockResolvedValueOnce(user);

        await expect(createUserService.execute({actor, payload})).resolves.toEqual(new UserDto(user));

        expect(User.signUp).toHaveBeenCalledWith(payload);

        expect(user.events).toHaveLength(1);
        expect(user.events[0]).toBeInstanceOf(UserSignedUpEvent);
        expect(user.events).toEqual([
            {
                type: UserSignedUpEvent.type,
                timestamp: now,
                user,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(user);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(
            {
                ...actor,
                userId: user.id,
            },
            user
        );
    });

    it('should throw an error if the username is already in use', async () => {
        const payload: SignUpUserDto = {
            name: 'John',
            email: Email.create('john.doe@example.com'),
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const user = await User.signUp(payload);

        jest.spyOn(User, 'signUp').mockResolvedValueOnce(user);
        jest.spyOn(userRepository, 'save').mockRejectedValue(new DuplicateUsernameException('Duplicated username'));

        await expect(createUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a user with a username already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the email is already in use', async () => {
        const payload: SignUpUserDto = {
            name: 'John',
            email: Email.create('john.doe@example.com'),
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const user = await User.signUp(payload);

        jest.spyOn(User, 'signUp').mockResolvedValueOnce(user);
        jest.spyOn(userRepository, 'save').mockRejectedValue(new DuplicateEmailException('Duplicated email'));

        await expect(createUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a user with an email already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the user', async () => {
        const payload: SignUpUserDto = {
            name: 'John',
            email: Email.create('john.doe@example.com'),
            username: Username.create('johndoe'),
            password: '@SecurePassword123',
        };

        const user = await User.signUp(payload);

        jest.spyOn(User, 'signUp').mockResolvedValueOnce(user);
        jest.spyOn(userRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createUserService.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'Unexpected error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
