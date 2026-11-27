import {Inject, Injectable} from '@nestjs/common';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException, AccessDeniedReason, PreconditionException} from '@domain/@shared/exceptions';
import type {Appointment} from '@domain/appointment/entities';
import {AttendanceRepository} from '@domain/attendance/attendance.repository';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

export const TRIAGE_NOT_RELEASED = 'The patient must be released by the triage before being called.';

/**
 * De quais agendas o membro pode operar a fila (chamar, triar, finalizar):
 * - OWNER/ADMIN: todas as agendas da clínica;
 * - SECRETARY: a própria (se também atende) e as agendas concedidas em ProfessionalAgendaAccess;
 * - PROFESSIONAL: só a própria agenda. O médico chama apenas os seus pacientes.
 */
@Injectable()
export class AttendanceScope {
    constructor(
        private readonly members: ClinicMemberRepository,
        private readonly agendaAccess: ProfessionalAgendaAccessRepository,
        private readonly clinics: ClinicRepository,
        @Inject(AttendanceRepository) private readonly attendance: AttendanceRepository
    ) {}

    /** `null` = todas as agendas da clínica. */
    async operableAgendas(actor: Actor): Promise<ClinicMemberId[] | null> {
        const member = await this.members.findById(actor.clinicMemberId);

        if (member === null || !member.isActive || !member.clinicId.equals(actor.clinicId)) return [];

        if (member.hasRole(ClinicMemberRole.OWNER) || member.hasRole(ClinicMemberRole.ADMIN)) return null;

        const own = member.hasRole(ClinicMemberRole.PROFESSIONAL) ? [actor.clinicMemberId] : [];

        if (!member.hasRole(ClinicMemberRole.SECRETARY)) return own;

        const grants = await this.agendaAccess.findByGranteeId(actor.clinicId, actor.clinicMemberId);

        return [
            ...own,
            ...grants
                .filter(
                    (grant) =>
                        grant.clinicId.equals(actor.clinicId) && grant.granteeMemberId.equals(actor.clinicMemberId)
                )
                .map((grant) => grant.professionalMemberId),
        ];
    }

    async canOperate(actor: Actor, attendedByMemberId: ClinicMemberId): Promise<boolean> {
        const agendas = await this.operableAgendas(actor);

        return agendas === null || agendas.some((memberId) => memberId.equals(attendedByMemberId));
    }

    async assertCanOperate(actor: Actor, attendedByMemberId: ClinicMemberId): Promise<void> {
        const agendas = await this.operableAgendas(actor);

        if (agendas === null || agendas.some((memberId) => memberId.equals(attendedByMemberId))) return;

        throw new AccessDeniedException(
            'Only the attending professional or reception with access to this agenda can operate this patient.',
            AccessDeniedReason.INSUFFICIENT_PERMISSIONS
        );
    }

    /** Chamar = operar a agenda + triagem liberada, quando a clínica exige triagem. */
    async assertCanCall(actor: Actor, appointment: Appointment): Promise<void> {
        await this.assertCanOperate(actor, appointment.attendedByMemberId);

        if (!(await this.triageRequired(actor))) return;

        const triage = await this.attendance.findTriage(actor.clinicId, appointment.id);

        if ((triage?.releasedAt ?? null) === null) throw new PreconditionException(TRIAGE_NOT_RELEASED);
    }

    async triageRequired(actor: Actor): Promise<boolean> {
        return (await this.clinics.findById(actor.clinicId))?.triageRequired ?? false;
    }
}
