import {mock} from 'jest-mock-extended';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {CreateClinicMemberAccountService} from '@application/clinic-member/services/create-clinic-member-account.service';
import type {CreateClinicMemberService} from '@application/clinic-member/services/create-clinic-member.service';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, PreconditionException} from '@domain/@shared/exceptions';
import type {AtomicExecutor} from '@domain/@shared/repository';
import {Email} from '@domain/@shared/value-objects';
import {GlobalRole} from '@domain/auth';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import type {EventDispatcher} from '@domain/event';
import {User, UserId} from '@domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '@domain/user/user.exceptions';
import type {UserRepository} from '@domain/user/user.repository';
import {Username} from '@domain/user/value-objects';

function setup() {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const userRepository = mock<UserRepository>();
    const createMember = mock<CreateClinicMemberService>();
    const dispatcher = mock<EventDispatcher>();
    const atomicExecutor = mock<AtomicExecutor>();

    atomicExecutor.runAtomically.mockImplementation((callback) => callback());

    const service = new CreateClinicMemberAccountService(userRepository, createMember, dispatcher);

    Object.assign(service, {atomicExecutor});

    const payload = {
        name: 'Maria Silva',
        username: Username.create('maria'),
        email: Email.create('maria@example.com'),
        password: 'M4ria.Silva!',
        roles: [ClinicMemberRole.PROFESSIONAL],
        displayName: null,
        color: '#123456',
        acceptExtraCharge: false,
    };

    return {actor, userRepository, createMember, dispatcher, service, payload};
}

describe('CreateClinicMemberAccountService', () => {
    it('creates a GlobalRole.NONE user and adds it to the actor clinic', async () => {
        const {actor, userRepository, createMember, dispatcher, service, payload} = setup();
        const member = ClinicMember.create({
            clinicId: actor.clinicId,
            userId: UserId.generate(),
            roles: payload.roles,
            displayName: 'Maria Silva',
            color: null,
            isActive: true,
            invitedByMemberId: actor.clinicMemberId,
        });
        const dto = new ClinicMemberDto(member);

        createMember.execute.mockResolvedValue(dto);

        await expect(service.execute({actor, payload})).resolves.toBe(dto);

        const saved = userRepository.save.mock.calls[0]?.[0];

        expect(saved).toBeInstanceOf(User);
        expect(saved?.globalRole).toBe(GlobalRole.NONE);
        expect(createMember.execute).toHaveBeenCalledWith({
            actor,
            payload: {
                clinicId: actor.clinicId.toString(),
                userId: saved?.id.toString(),
                roles: payload.roles,
                displayName: 'Maria Silva',
                color: '#123456',
                acceptExtraCharge: false,
            },
        });
        expect(dispatcher.dispatch).toHaveBeenCalledWith(actor, saved);
    });

    it('requires a clinic context', async () => {
        const {actor, service, payload, userRepository} = setup();

        await expect(
            service.execute({actor: {...actor, clinicId: null as unknown as ClinicId}, payload})
        ).rejects.toThrow(AccessDeniedException);
        expect(userRepository.save).not.toHaveBeenCalled();
    });

    it.each([
        [new DuplicateUsernameException(), 'Cannot create a user with a username already in use.'],
        [new DuplicateEmailException(), 'Cannot create a user with an email already in use.'],
    ])('maps duplicates to a precondition error', async (error, message) => {
        const {actor, service, payload, userRepository, createMember} = setup();

        userRepository.save.mockRejectedValueOnce(error);

        await expect(service.execute({actor, payload})).rejects.toThrowWithMessage(PreconditionException, message);
        expect(createMember.execute).not.toHaveBeenCalled();
    });

    it('rethrows other persistence errors', async () => {
        const {actor, service, payload, userRepository} = setup();
        const failure = new Error('db down');

        userRepository.save.mockRejectedValueOnce(failure);

        await expect(service.execute({actor, payload})).rejects.toBe(failure);
    });
});
