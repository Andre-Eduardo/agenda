import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {AccessDeniedException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {UserDeletedEvent} from '../../../../domain/user/events';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword} from '../../../../domain/user/value-objects';
import type {DeleteUserDto} from '../../dtos';
import {DeleteUserService} from '../index';

describe('A delete-user service', () => {
    const userRepository = mock<UserRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteUserService = new DeleteUserService(userRepository, eventDispatcher);

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

    it('should delete a user', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });

        const payload: DeleteUserDto = {
            id: existingUser.id,
            password: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        await deleteUserService.execute({actor, payload});

        expect(existingUser.events).toHaveLength(1);
        expect(existingUser.events[0]).toBeInstanceOf(UserDeletedEvent);
        expect(existingUser.events).toEqual([
            {
                type: UserDeletedEvent.type,
                timestamp: now,
                user: existingUser,
            },
        ]);

        expect(userRepository.delete).toHaveBeenCalledWith(existingUser.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
    });

    it('should throw an error when the user does not exist', async () => {
        const payload: DeleteUserDto = {
            id: UserId.generate(),
            password: '@SecurePassword123',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'User not found.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the given password is incorrect', async () => {
        const existingUser = fakeUser();

        const payload: DeleteUserDto = {
            id: UserId.generate(),
            password: 'wrong-password',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);

        await expect(deleteUserService.execute({actor, payload})).rejects.toThrowWithMessage(
            AccessDeniedException,
            'Incorrect password.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
