import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {AccessDeniedException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {mockTransactional} from '../../../../domain/@shared/repository/__tests__/mock-transactional';
import type {AuditLogRepository} from '../../../../domain/audit/audit-log.repository';
import {GlobalRole} from '../../../../domain/auth';
import type {ClinicMemberRepository} from '../../../../domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberId, ClinicMemberRole} from '../../../../domain/clinic-member/entities';
import type {ClinicRepository} from '../../../../domain/clinic/clinic.repository';
import {ClinicId} from '../../../../domain/clinic/entities';
import {fakeClinic} from '../../../../domain/clinic/entities/__tests__/fake-clinic';
import type {EventDispatcher} from '../../../../domain/event';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {EnterSupportAccessService, SUPPORT_ACCESS_ENTER_ACTION} from '../enter-support-access.service';

describe('An enter support access service', () => {
    const userRepository = mock<UserRepository>();
    const clinicRepository = mock<ClinicRepository>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const auditLogRepository = mock<AuditLogRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const service = new EnterSupportAccessService(
        userRepository,
        clinicRepository,
        clinicMemberRepository,
        auditLogRepository,
        eventDispatcher
    );

    mockTransactional(service);

    const clinic = fakeClinic();

    function actorFor(globalRole: GlobalRole) {
        const user = fakeUser({globalRole, clinicMembers: [], name: 'Ana'});
        const actor = {
            userId: user.id,
            clinicId: null,
            clinicMemberId: null,
            ip: '127.0.0.1',
        } as unknown as Actor;

        userRepository.findById.mockResolvedValue(user);
        clinicRepository.findById.mockResolvedValue(clinic);

        return {user, actor};
    }

    it.each([GlobalRole.SUPPORT, GlobalRole.SUPER_ADMIN])(
        'should create a support access the first time a %s user enters a clinic and audit it',
        async (globalRole) => {
            const {user, actor} = actorFor(globalRole);

            clinicMemberRepository.findByClinicAndUser.mockResolvedValueOnce(null);

            const result = await service.execute({actor, payload: {clinicId: clinic.id}});

            expect(result).toMatchObject({
                clinicId: clinic.id.toString(),
                userId: user.id.toString(),
                roles: [],
                supportAccess: true,
                displayName: 'Ana (suporte)',
            });
            expect(clinicMemberRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({supportAccess: true, clinicId: clinic.id})
            );
            expect(auditLogRepository.append).toHaveBeenCalledWith({
                clinicId: clinic.id.toString(),
                actorUserId: user.id.toString(),
                actorMemberId: result.id,
                resource: 'SupportAccess',
                resourceId: clinic.id.toString(),
                action: SUPPORT_ACCESS_ENTER_ACTION,
                result: 'SUCCESS',
                statusCode: 200,
                ip: '127.0.0.1',
            });
        }
    );

    it('should reuse the support access on later entries and reactivate it', async () => {
        const {user, actor} = actorFor(GlobalRole.SUPPORT);
        const existing = ClinicMember.createSupportAccess({clinicId: clinic.id, userId: user.id, displayName: 'Ana'});

        existing.isActive = false;
        clinicMemberRepository.findByClinicAndUser.mockResolvedValueOnce(existing);

        const result = await service.execute({actor, payload: {clinicId: clinic.id}});

        expect(result.id).toBe(existing.id.toString());
        expect(existing.isActive).toBe(true);
    });

    it("should enter through the user's own membership when they are an employee of the clinic", async () => {
        const {user, actor} = actorFor(GlobalRole.SUPER_ADMIN);
        const employee = ClinicMember.create({
            clinicId: clinic.id,
            userId: user.id,
            roles: [ClinicMemberRole.OWNER],
            isActive: true,
        });

        clinicMemberRepository.findByClinicAndUser.mockResolvedValueOnce(employee);

        const result = await service.execute({actor, payload: {clinicId: clinic.id}});

        expect(result).toMatchObject({id: employee.id.toString(), supportAccess: false});
    });

    it.each([GlobalRole.NONE, GlobalRole.OWNER])('should refuse a %s user', async (globalRole) => {
        const {actor} = actorFor(globalRole);

        await expect(service.execute({actor, payload: {clinicId: clinic.id}})).rejects.toThrow(AccessDeniedException);

        expect(clinicMemberRepository.save).not.toHaveBeenCalled();
        expect(auditLogRepository.append).not.toHaveBeenCalled();
    });

    it('should fail for an unknown clinic', async () => {
        const {actor} = actorFor(GlobalRole.SUPPORT);

        clinicRepository.findById.mockResolvedValue(null);

        await expect(service.execute({actor, payload: {clinicId: ClinicId.generate()}})).rejects.toThrow(
            ResourceNotFoundException
        );
    });

    it('should refuse to enter through an inactive employee membership', async () => {
        const {user, actor} = actorFor(GlobalRole.SUPER_ADMIN);
        const employee = ClinicMember.create({
            clinicId: clinic.id,
            userId: user.id,
            roles: [ClinicMemberRole.SECRETARY],
            isActive: false,
        });

        employee.id = ClinicMemberId.generate();
        clinicMemberRepository.findByClinicAndUser.mockResolvedValueOnce(employee);

        await expect(service.execute({actor, payload: {clinicId: clinic.id}})).rejects.toThrow(AccessDeniedException);
    });
});
