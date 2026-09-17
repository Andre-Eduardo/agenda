import {Injectable} from '@nestjs/common';
import {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

/**
 * Resolve se `actor` pode gerenciar a agenda (expediente/bloqueios) de
 * `professionalMemberId`, na ordem: próprio profissional > OWNER/ADMIN > concessão
 * explícita via ProfessionalAgendaAccess. Ver doc da entidade para o racional.
 */
@Injectable()
export class AgendaAccessChecker {
    constructor(
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly agendaAccessRepository: ProfessionalAgendaAccessRepository
    ) {}

    async assertCanManage(actor: Actor, professionalMemberId: ClinicMemberId): Promise<void> {
        if (actor.clinicMemberId.toString() === professionalMemberId.toString()) {
            return;
        }

        const actorMember = await this.clinicMemberRepository.findById(actor.clinicMemberId);

        if (
            actorMember !== null &&
            (actorMember.hasRole(ClinicMemberRole.OWNER) || actorMember.hasRole(ClinicMemberRole.ADMIN))
        ) {
            return;
        }

        const grant = await this.agendaAccessRepository.findByGranteeAndProfessional(
            actor.clinicMemberId,
            professionalMemberId
        );

        if (grant !== null) {
            return;
        }

        throw new AccessDeniedException(
            `Member ${actor.clinicMemberId.toString()} cannot manage the agenda for member ${professionalMemberId.toString()}.`,
            AccessDeniedReason.INSUFFICIENT_PERMISSIONS
        );
    }
}
