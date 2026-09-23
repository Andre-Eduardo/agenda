import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {AccessDeniedException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AtomicExecutor} from '../../../../domain/@shared/repository';
import type {ClinicMemberRepository} from '../../../../domain/clinic-member/clinic-member.repository';
import {ClinicMemberRole} from '../../../../domain/clinic-member/entities';
import {fakeClinicMember} from '../../../../domain/clinic-member/entities/__tests__/fake-clinic-member';
import {ClinicMemberDeletedEvent} from '../../../../domain/clinic-member/events';
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
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const atomicExecutor = mock<AtomicExecutor>();
    const deleteUserService = new DeleteUserService(userRepository, clinicMemberRepository, eventDispatcher);

    // `@Transactional()` injects the executor as a property; run the callback directly in unit tests.
    (deleteUserService as unknown as {atomicExecutor: AtomicExecutor}).atomicExecutor = atomicExecutor;

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
        atomicExecutor.runAtomically.mockImplementation((callback) => callback());
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
        jest.spyOn(clinicMemberRepository, 'findByUserId').mockResolvedValueOnce([]);

        await deleteUserService.execute({actor, payload});

        expect(existingUser.deletedAt).toEqual(now);
        expect(existingUser.isDeleted()).toBe(true);
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

    it('should revoke every clinic membership of the deleted user', async () => {
        const existingUser = fakeUser({
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
        });
        const memberships = [
            fakeClinicMember({userId: existingUser.id, roles: [ClinicMemberRole.PROFESSIONAL]}),
            fakeClinicMember({userId: existingUser.id, roles: [ClinicMemberRole.SECRETARY]}),
        ];

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);
        jest.spyOn(clinicMemberRepository, 'findByUserId').mockResolvedValueOnce(memberships);

        await deleteUserService.execute({actor, payload: {id: existingUser.id, password: '@SecurePassword123'}});

        expect(clinicMemberRepository.findByUserId).toHaveBeenCalledWith(existingUser.id);

        for (const member of memberships) {
            expect(member.deletedAt).toEqual(now);
            expect(member.events[0]).toBeInstanceOf(ClinicMemberDeletedEvent);
            expect(clinicMemberRepository.save).toHaveBeenCalledWith(member);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, member);
        }

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
        expect(clinicMemberRepository.findByUserId).not.toHaveBeenCalled();
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
        expect(existingUser.isDeleted()).toBe(false);
    });
});
