import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {Email} from '../../../../domain/@shared/value-objects';
import type {AuditLogRepository} from '../../../../domain/audit/audit-log.repository';
import {GlobalRole} from '../../../../domain/auth';
import type {ClinicMemberRepository} from '../../../../domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId} from '../../../../domain/clinic-member/entities';
import {ClinicId} from '../../../../domain/clinic/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {DuplicateUsernameException} from '../../../../domain/user/user.exceptions';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {Username} from '../../../../domain/user/value-objects';
import {CreateSupportUserService} from '../create-support-user.service';
import {LeaveSupportAccessService, SUPPORT_ACCESS_LEAVE_ACTION} from '../leave-support-access.service';
import {ListSupportUsersService} from '../list-support-users.service';
import {RevokeSupportUserService} from '../revoke-support-user.service';

const actor: Actor = {
    userId: UserId.generate(),
    clinicId: ClinicId.generate(),
    clinicMemberId: ClinicMemberId.generate(),
    ip: '127.0.0.1',
};

describe('The support user services', () => {
    const userRepository = mock<UserRepository>();
    const eventDispatcher = mock<EventDispatcher>();

    it('should create a global support user without clinics', async () => {
        const service = new CreateSupportUserService(userRepository, eventDispatcher);

        const result = await service.execute({
            actor,
            payload: {
                name: 'Ana (Suporte)',
                username: Username.create('suporte.ana'),
                email: Email.create('ana@suporte.com'),
                password: '@SecurePassword123',
            },
        });

        expect(result).toMatchObject({name: 'Ana (Suporte)', username: 'suporte.ana', email: 'ana@suporte.com'});
        expect(userRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({globalRole: GlobalRole.SUPPORT, clinicMembers: []})
        );
        expect(eventDispatcher.dispatch).toHaveBeenCalled();
    });

    it('should refuse a username already in use', async () => {
        const service = new CreateSupportUserService(userRepository, eventDispatcher);

        userRepository.save.mockRejectedValueOnce(new DuplicateUsernameException('Duplicate username.'));

        await expect(
            service.execute({
                actor,
                payload: {name: 'Ana', username: Username.create('suporte.ana'), password: '@SecurePassword123'},
            })
        ).rejects.toThrow(PreconditionException);
    });

    it('should list only support users', async () => {
        const service = new ListSupportUsersService(userRepository);
        const support = fakeUser({globalRole: GlobalRole.SUPPORT});

        userRepository.search.mockResolvedValueOnce({data: [support], totalCount: 1});

        await expect(service.execute({actor, payload: undefined})).resolves.toEqual([
            expect.objectContaining({id: support.id.toString()}),
        ]);
        expect(userRepository.search).toHaveBeenCalledWith(expect.anything(), {globalRoles: [GlobalRole.SUPPORT]});
    });

    it('should revoke the support role', async () => {
        const service = new RevokeSupportUserService(userRepository, eventDispatcher);
        const support = fakeUser({globalRole: GlobalRole.SUPPORT});

        userRepository.findById.mockResolvedValueOnce(support);

        await service.execute({actor, payload: {id: support.id}});

        expect(support.globalRole).toBe(GlobalRole.NONE);
        expect(userRepository.save).toHaveBeenCalledWith(support);
    });

    it.each([GlobalRole.SUPER_ADMIN, GlobalRole.OWNER, GlobalRole.NONE])(
        'should not touch a %s user when revoking support',
        async (globalRole) => {
            const service = new RevokeSupportUserService(userRepository, eventDispatcher);
            const user = fakeUser({globalRole});

            userRepository.findById.mockResolvedValueOnce(user);

            await expect(service.execute({actor, payload: {id: user.id}})).rejects.toThrow(ResourceNotFoundException);
            expect(user.globalRole).toBe(globalRole);
            expect(userRepository.save).not.toHaveBeenCalled();
        }
    );
});

describe('A leave support access service', () => {
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const auditLogRepository = mock<AuditLogRepository>();
    const service = new LeaveSupportAccessService(clinicMemberRepository, auditLogRepository);

    it('should record the exit of a support user', async () => {
        const support = ClinicMember.createSupportAccess({
            clinicId: actor.clinicId,
            userId: actor.userId,
            displayName: 'Ana (suporte)',
        });

        clinicMemberRepository.findById.mockResolvedValueOnce(support);

        await service.execute({actor: {...actor, clinicMemberId: support.id}, payload: undefined});

        expect(auditLogRepository.append).toHaveBeenCalledWith(
            expect.objectContaining({
                clinicId: actor.clinicId.toString(),
                actorMemberId: support.id.toString(),
                action: SUPPORT_ACCESS_LEAVE_ACTION,
            })
        );
    });

    it('should record nothing outside a support access', async () => {
        clinicMemberRepository.findById.mockResolvedValueOnce(null);

        await service.execute({actor, payload: undefined});

        expect(auditLogRepository.append).not.toHaveBeenCalled();
    });
});
