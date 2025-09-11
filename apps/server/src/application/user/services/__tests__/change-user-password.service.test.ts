import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {AccessDeniedException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {UserPasswordChangedEvent} from '../../../../domain/user/events';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword} from '../../../../domain/user/value-objects';
import type {ChangeUserPasswordDto} from '../../dtos';
import {ChangeUserPasswordService} from '../index';

describe('A change-user-password service', () => {
    const userRepository = mock<UserRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const changeUserPasswordService = new ChangeUserPasswordService(userRepository, eventDispatcher);

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

    it('should update the user password', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const oldUser = fakeUser(existingUser);

        const payload: ChangeUserPasswordDto = {
            oldPassword: '@SecurePassword123',
            newPassword: 'Pa$$w0rd',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        await changeUserPasswordService.execute({actor, payload});

        expect(existingUser.password).not.toBe(oldUser.password);
        await expect(existingUser.password.verify('Pa$$w0rd')).resolves.toBe(true);

        expect(existingUser.events).toHaveLength(1);
        expect(existingUser.events[0]).toBeInstanceOf(UserPasswordChangedEvent);
        expect(existingUser.events).toEqual([
            {
                type: UserPasswordChangedEvent.type,
                timestamp: now,
                userId: existingUser.id,
            },
        ]);

        expect(userRepository.save).toHaveBeenCalledWith(existingUser);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
    });

    it('should throw an error when the user does not exist', async () => {
        const payload: ChangeUserPasswordDto = {
            oldPassword: '@SecurePassword123',
            newPassword: 'Pa$$w0rd',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);

        await expect(changeUserPasswordService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'User not found.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the given password is incorrect', async () => {
        const existingUser = fakeUser();

        const payload: ChangeUserPasswordDto = {
            oldPassword: 'wrong-password',
            newPassword: 'Pa$$w0rd',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        await expect(changeUserPasswordService.execute({actor, payload})).rejects.toThrowWithMessage(
            AccessDeniedException,
            'Incorrect password.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
