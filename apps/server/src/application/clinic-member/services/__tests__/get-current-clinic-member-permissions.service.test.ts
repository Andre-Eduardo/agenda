import {mock} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {createAuthorizer} from '@domain/auth/authorizer';
import {clinicMemberRolePermissionsMap} from '@domain/auth/authorizer/clinic-member-role.authorizer';
import {GlobalRole} from '@domain/auth/global-role';
import {UserPermission} from '@domain/auth/permission';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {UserId} from '@domain/user/entities';
import {fakeUser} from '@domain/user/entities/__tests__/fake-user';
import type {UserRepository} from '@domain/user/user.repository';
import {GetCurrentClinicMemberPermissionsService} from '../get-current-clinic-member-permissions.service';

function setup(roles: ClinicMemberRole[], isActive = true) {
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const member = new ClinicMember({
        id: actor.clinicMemberId,
        userId: actor.userId,
        clinicId: actor.clinicId,
        roles,
        displayName: null,
        color: null,
        isActive,
        invitedByMemberId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        deletedAt: null,
    });
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const userRepository = mock<UserRepository>();

    clinicMemberRepository.findById.mockResolvedValue(member);
    userRepository.findById.mockResolvedValue(
        fakeUser({id: actor.userId, globalRole: GlobalRole.NONE, clinicMembers: [actor.clinicMemberId]})
    );
    const authorizer = createAuthorizer(userRepository, clinicMemberRepository);
    const service = new GetCurrentClinicMemberPermissionsService(clinicMemberRepository, authorizer);

    return {actor, member, service, clinicMemberRepository, userRepository};
}

describe('current clinic member permissions', () => {
    it.each(Object.values(ClinicMemberRole))('returns effective permissions for %s', async (role) => {
        const {actor, service, clinicMemberRepository, userRepository} = setup([role]);
        const result = await service.execute({actor, payload: undefined});
        const expected = new Set([
            ...clinicMemberRolePermissionsMap[role],
            UserPermission.VIEW_PROFILE,
            UserPermission.CHANGE_PASSWORD,
        ]);

        expect(result.permissions).toEqual([...expected].toSorted((first, second) => first.localeCompare(second)));
        expect(clinicMemberRepository.findById).toHaveBeenCalledWith(actor.clinicMemberId);
        expect(userRepository.findById).toHaveBeenCalledWith(actor.userId);
    });

    it('unites multiple roles', async () => {
        const {actor, service} = setup([ClinicMemberRole.PROFESSIONAL, ClinicMemberRole.SECRETARY]);
        const result = await service.execute({actor, payload: undefined});

        expect(result.permissions).toContain('clinical-chat:create');
        expect(result.permissions).toContain('appointment-payment:register');
        expect(new Set(result.permissions).size).toBe(result.permissions.length);
    });

    it.each(['inactive', 'wrong user', 'wrong clinic', 'missing'])(
        'denies access to an %s membership',
        async (condition) => {
            const {actor, member, service, clinicMemberRepository, userRepository} = setup([ClinicMemberRole.VIEWER]);

            if (condition === 'inactive') {
                member.isActive = false;
            } else if (condition === 'wrong user') {
                member.userId = UserId.generate();
            } else if (condition === 'wrong clinic') {
                member.clinicId = ClinicId.generate();
            } else {
                clinicMemberRepository.findById.mockResolvedValue(null);
            }

            await expect(service.execute({actor, payload: undefined})).rejects.toMatchObject({
                constructor: AccessDeniedException,
                reason: AccessDeniedReason.NOT_ALLOWED,
            });
            expect(userRepository.findById).not.toHaveBeenCalled();
        }
    );
});
