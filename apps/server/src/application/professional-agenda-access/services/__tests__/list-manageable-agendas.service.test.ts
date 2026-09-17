import {mock} from 'jest-mock-extended';
import {ListManageableAgendasService} from '@application/professional-agenda-access/services/list-manageable-agendas.service';
import type {Actor} from '@domain/@shared/actor';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {ProfessionalAgendaAccess} from '@domain/professional-agenda-access/entities';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';
import {UserId} from '@domain/user/entities';

describe('ListManageableAgendasService', () => {
    const clinicId = ClinicId.generate();

    let clinicMemberRepository: ReturnType<typeof mock<ClinicMemberRepository>>;
    let agendaAccessRepository: ReturnType<typeof mock<ProfessionalAgendaAccessRepository>>;
    let service: ListManageableAgendasService;

    const memberOf = (roles: ClinicMemberRole[]) =>
        ClinicMember.create({
            clinicId,
            userId: UserId.generate(),
            roles,
            displayName: null,
            color: null,
            isActive: true,
            invitedByMemberId: null,
        });

    beforeEach(() => {
        clinicMemberRepository = mock<ClinicMemberRepository>();
        agendaAccessRepository = mock<ProfessionalAgendaAccessRepository>();
        agendaAccessRepository.findByGranteeId.mockResolvedValue([]);
        service = new ListManageableAgendasService(clinicMemberRepository, agendaAccessRepository);
    });

    const actorFor = (member: ClinicMember): Actor =>
        ({
            userId: member.userId,
            clinicId,
            clinicMemberId: member.id,
            ip: '127.0.0.1',
        }) as unknown as Actor;

    it('returns every professional in the clinic for an OWNER', async () => {
        const owner = memberOf([ClinicMemberRole.OWNER]);
        const professionalA = memberOf([ClinicMemberRole.PROFESSIONAL]);
        const professionalB = memberOf([ClinicMemberRole.PROFESSIONAL]);
        const secretary = memberOf([ClinicMemberRole.SECRETARY]);

        clinicMemberRepository.findById.mockResolvedValue(owner);
        clinicMemberRepository.findByClinicId.mockResolvedValue([owner, professionalA, professionalB, secretary]);

        const result = await service.execute({actor: actorFor(owner), payload: undefined});

        expect(result.map((m) => m.id).toSorted((a, b) => a.localeCompare(b))).toEqual(
            [professionalA.id.toString(), professionalB.id.toString()].toSorted((a, b) => a.localeCompare(b))
        );
    });

    it('returns every professional in the clinic for an ADMIN', async () => {
        const admin = memberOf([ClinicMemberRole.ADMIN]);
        const professional = memberOf([ClinicMemberRole.PROFESSIONAL]);

        clinicMemberRepository.findById.mockResolvedValue(admin);
        clinicMemberRepository.findByClinicId.mockResolvedValue([admin, professional]);

        const result = await service.execute({actor: actorFor(admin), payload: undefined});

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe(professional.id.toString());
    });

    it('returns only itself for a PROFESSIONAL', async () => {
        const professional = memberOf([ClinicMemberRole.PROFESSIONAL]);

        clinicMemberRepository.findById.mockResolvedValue(professional);

        const result = await service.execute({actor: actorFor(professional), payload: undefined});

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe(professional.id.toString());
        expect(clinicMemberRepository.findByClinicId).not.toHaveBeenCalled();
    });

    it('returns granted professionals for other roles', async () => {
        const secretary = memberOf([ClinicMemberRole.SECRETARY]);
        const grantedProfessional = memberOf([ClinicMemberRole.PROFESSIONAL]);

        clinicMemberRepository.findById.mockImplementation((id) => {
            if (id.equals(secretary.id)) return Promise.resolve(secretary);

            if (id.equals(grantedProfessional.id)) return Promise.resolve(grantedProfessional);

            return Promise.resolve(null);
        });
        agendaAccessRepository.findByGranteeId.mockResolvedValue([
            ProfessionalAgendaAccess.create({
                clinicId,
                granteeMemberId: secretary.id,
                professionalMemberId: grantedProfessional.id,
                reason: null,
            }),
        ]);

        const result = await service.execute({actor: actorFor(secretary), payload: undefined});

        expect(result).toHaveLength(1);
        expect(result[0]?.id).toBe(grantedProfessional.id.toString());
    });

    it('returns an empty list for other roles without any grant', async () => {
        const viewer = memberOf([ClinicMemberRole.VIEWER]);

        clinicMemberRepository.findById.mockResolvedValue(viewer);
        agendaAccessRepository.findByGranteeId.mockResolvedValue([]);

        const result = await service.execute({actor: actorFor(viewer), payload: undefined});

        expect(result).toEqual([]);
    });

    it('combines both roles for a member who is OWNER and PROFESSIONAL at once', async () => {
        const ownerProfessional = memberOf([ClinicMemberRole.OWNER, ClinicMemberRole.PROFESSIONAL]);
        const otherProfessional = memberOf([ClinicMemberRole.PROFESSIONAL]);

        clinicMemberRepository.findById.mockResolvedValue(ownerProfessional);
        clinicMemberRepository.findByClinicId.mockResolvedValue([ownerProfessional, otherProfessional]);

        const result = await service.execute({actor: actorFor(ownerProfessional), payload: undefined});

        expect(result.map((m) => m.id).toSorted((a, b) => a.localeCompare(b))).toEqual(
            [ownerProfessional.id.toString(), otherProfessional.id.toString()].toSorted((a, b) => a.localeCompare(b))
        );
    });
});
