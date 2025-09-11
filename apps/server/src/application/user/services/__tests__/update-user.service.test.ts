import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    AccessDeniedException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import {Email} from '../../../../domain/@shared/value-objects';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {UserChangedEvent} from '../../../../domain/user/events';
import {DuplicateEmailException, DuplicateUsernameException} from '../../../../domain/user/user.exceptions';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../../../domain/user/value-objects';
import type {UpdateUserDto} from '../../dtos';
import {UserDto} from '../../dtos';
import {UpdateUserService} from '../index';

describe('An update-user service', () => {
    const userRepository = mock<UserRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateUserService = new UpdateUserService(userRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update a user', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const oldUser = fakeUser(existingUser);

        const payload: UpdateUserDto = {
            id: existingUser.id,
            firstName: 'Jorge',
            lastName: null,
            email: Email.create('john.doe@example.com'),
            username: Username.create('johndoe'),
            currentPassword: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        const updatedUser = fakeUser({
            ...existingUser,
            ...payload,
            updatedAt: now,
        });

        await expect(updateUserService.execute({actor, payload})).resolves.toEqual(new UserDto(updatedUser));

        expect(existingUser.firstName).toBe(payload.firstName);
        expect(existingUser.lastName).toBe(payload.lastName);
        expect(existingUser.email).toBe(payload.email);
        expect(existingUser.username).toBe(payload.username);
        expect(existingUser.updatedAt).toEqual(now);

        expect(existingUser.events).toHaveLength(1);
        expect(existingUser.events[0]).toBeInstanceOf(UserChangedEvent);
        expect(existingUser.events).toEqual([
            {
                type: UserChangedEvent.type,
                timestamp: now,
                oldState: oldUser,
                newState: existingUser,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(existingUser);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
    });

    it('should throw an error when the user does not exist', async () => {
        const payload: UpdateUserDto = {
            id: UserId.generate(),
            firstName: 'Jorge',
            currentPassword: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'User not found.'
        );
    });

    it('should throw an error when the given password is incorrect', async () => {
        const existingUser = fakeUser({
            email: Email.create('john.doe@example.com'),
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const payload: UpdateUserDto = {
            id: UserId.generate(),
            firstName: 'Jorge',
            currentPassword: 'wrong-password',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        await expect(updateUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            AccessDeniedException,
            'Incorrect password.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the new username is already in use', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const payload: UpdateUserDto = {
            id: UserId.generate(),
            username: Username.create('johndoe1'),
            currentPassword: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);
        jest.spyOn(userRepository, 'save').mockRejectedValue(new DuplicateUsernameException('Duplicated username'));

        await expect(updateUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update the user with a username already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the new email is already in use', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const payload: UpdateUserDto = {
            id: UserId.generate(),
            email: Email.create('john.doe1@example.com'),
            currentPassword: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);
        jest.spyOn(userRepository, 'save').mockRejectedValue(new DuplicateEmailException('Duplicated email'));

        await expect(updateUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update the user with an email already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the user', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const payload: UpdateUserDto = {
            id: UserId.generate(),
            email: Email.create('john.doe@example.com'),
            currentPassword: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);
        jest.spyOn(userRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateUserService.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'Unexpected error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
