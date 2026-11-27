import {mock} from 'jest-mock-extended';
import {ChangeClinicAccountTypeService} from '@application/clinic/services';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, PreconditionException} from '@domain/@shared/exceptions';
import type {AtomicExecutor} from '@domain/@shared/repository';
import type {AuditLogRepository} from '@domain/audit/audit-log.repository';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberRole} from '@domain/clinic-member/entities';
import type {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicAccountType} from '@domain/clinic/entities';
import {fakeClinic} from '@domain/clinic/entities/__tests__/fake-clinic';
import type {EventDispatcher} from '@domain/event';
import {UserId} from '@domain/user/entities';

function setup(accountType: ClinicAccountType, roles = [ClinicMemberRole.OWNER, ClinicMemberRole.PROFESSIONAL]) {
    const clinic = fakeClinic({accountType, receptionEnabled: accountType === ClinicAccountType.CLINIC});
    const owner = ClinicMember.create({clinicId: clinic.id, userId: UserId.generate(), roles, isActive: true});
    const actor: Actor = {userId: owner.userId, clinicId: clinic.id, clinicMemberId: owner.id, ip: '127.0.0.1'};
    const clinicRepository = mock<ClinicRepository>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const auditLogRepository = mock<AuditLogRepository>();
    const atomicExecutor = mock<AtomicExecutor>();

    atomicExecutor.runAtomically.mockImplementation((callback) => callback());
    clinicRepository.findById.mockResolvedValue(clinic);
    clinicMemberRepository.findById.mockResolvedValue(owner);
    clinicMemberRepository.findByClinicId.mockResolvedValue([owner]);

    const service = new ChangeClinicAccountTypeService(
        clinicRepository,
        clinicMemberRepository,
        auditLogRepository,
        mock<EventDispatcher>()
    );

    Object.assign(service, {atomicExecutor});

    return {clinic, owner, actor, service, clinicRepository, clinicMemberRepository, auditLogRepository};
}

describe('Changing the account type', () => {
    it('turns a solo account into a clinic once the owner confirms team access, and audits it', async () => {
        const {actor, service, clinicRepository, auditLogRepository} = setup(ClinicAccountType.SOLO);

        await expect(
            service.execute({actor, payload: {accountType: ClinicAccountType.CLINIC, confirmTeamAccess: false}})
        ).rejects.toThrow(PreconditionException);
        expect(clinicRepository.save).not.toHaveBeenCalled();

        await expect(
            service.execute({actor, payload: {accountType: ClinicAccountType.CLINIC, confirmTeamAccess: true}})
        ).resolves.toMatchObject({accountType: ClinicAccountType.CLINIC, receptionEnabled: true});
        expect(auditLogRepository.append).toHaveBeenCalledWith(
            expect.objectContaining({action: 'CLINIC_ACCOUNT_TYPE:CHANGE:CLINIC', resource: 'Clinic'})
        );
    });

    it('lets only the owner decide', async () => {
        const {actor, service} = setup(ClinicAccountType.SOLO, [ClinicMemberRole.ADMIN]);

        await expect(
            service.execute({actor, payload: {accountType: ClinicAccountType.CLINIC, confirmTeamAccess: true}})
        ).rejects.toThrow(AccessDeniedException);
    });

    it('refuses going back to solo while the team has other active members, ignoring support access', async () => {
        const {actor, clinic, owner, service, clinicMemberRepository} = setup(ClinicAccountType.CLINIC);
        const support = ClinicMember.createSupportAccess({
            clinicId: clinic.id,
            userId: UserId.generate(),
            displayName: 'Suporte',
        });
        const secretary = ClinicMember.create({
            clinicId: clinic.id,
            userId: UserId.generate(),
            roles: [ClinicMemberRole.SECRETARY],
            isActive: true,
        });

        clinicMemberRepository.findByClinicId.mockResolvedValue([owner, support, secretary]);

        await expect(
            service.execute({actor, payload: {accountType: ClinicAccountType.SOLO, confirmTeamAccess: false}})
        ).rejects.toThrow(PreconditionException);

        clinicMemberRepository.findByClinicId.mockResolvedValue([owner, support]);

        await expect(
            service.execute({actor, payload: {accountType: ClinicAccountType.SOLO, confirmTeamAccess: false}})
        ).resolves.toMatchObject({accountType: ClinicAccountType.SOLO});
    });

    it('does nothing when the account already has that type', async () => {
        const {actor, service, clinicRepository} = setup(ClinicAccountType.CLINIC);

        await service.execute({actor, payload: {accountType: ClinicAccountType.CLINIC, confirmTeamAccess: false}});

        expect(clinicRepository.save).not.toHaveBeenCalled();
    });
});
