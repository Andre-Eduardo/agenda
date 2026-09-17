import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicMemberDto} from '@application/clinic-member/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import type {ClinicMember} from '@domain/clinic-member/entities';
import {ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

/**
 * Lists the agendas (as clinic members) the current actor is allowed to create
 * appointments for. A member's roles are additive: OWNER/ADMIN manage every
 * professional's agenda, PROFESSIONAL additionally grants their own agenda
 * (e.g. an OWNER who is also a PROFESSIONAL gets both), and anyone also
 * manages whatever was explicitly granted via ProfessionalAgendaAccess.
 * Mirrors the rules enforced by AgendaAccessChecker.
 */
@Injectable()
export class ListManageableAgendasService implements ApplicationService<undefined, ClinicMemberDto[]> {
    constructor(
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly agendaAccessRepository: ProfessionalAgendaAccessRepository
    ) {}

    async execute({actor}: Command): Promise<ClinicMemberDto[]> {
        const actorMember = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (actorMember === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', actor.clinicMemberId.toString());
        }

        // A member's manageable agendas are the UNION of what each of their roles
        // grants — e.g. an OWNER who is also a PROFESSIONAL gets both their own
        // agenda and everyone else's, not one or the other.
        const manageable = new Map<string, ClinicMember>();

        if (actorMember.hasRole(ClinicMemberRole.OWNER) || actorMember.hasRole(ClinicMemberRole.ADMIN)) {
            const members = await this.clinicMemberRepository.findByClinicId(actor.clinicId);

            for (const member of members) {
                if (member.hasRole(ClinicMemberRole.PROFESSIONAL)) {
                    manageable.set(member.id.toString(), member);
                }
            }
        }

        if (actorMember.hasRole(ClinicMemberRole.PROFESSIONAL)) {
            manageable.set(actorMember.id.toString(), actorMember);
        }

        const grants = await this.agendaAccessRepository.findByGranteeId(actor.clinicId, actor.clinicMemberId);
        const grantedProfessionals = await Promise.all(
            grants.map((grant) => this.clinicMemberRepository.findById(grant.professionalMemberId))
        );

        for (const professional of grantedProfessionals) {
            if (professional !== null) {
                manageable.set(professional.id.toString(), professional);
            }
        }

        return Array.from(manageable.values()).map((member) => new ClinicMemberDto(member));
    }
}
