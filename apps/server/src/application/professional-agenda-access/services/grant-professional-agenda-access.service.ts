import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {
    GrantProfessionalAgendaAccessDto,
    ProfessionalAgendaAccessDto,
} from '@application/professional-agenda-access/dtos';
import {InvalidInputException, PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {EventDispatcher} from '@domain/event';
import {ProfessionalAgendaAccess} from '@domain/professional-agenda-access/entities';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

type GrantProfessionalAgendaAccessPayload = GrantProfessionalAgendaAccessDto & {professionalMemberId: ClinicMemberId};

@Injectable()
export class GrantProfessionalAgendaAccessService implements ApplicationService<
    GrantProfessionalAgendaAccessPayload,
    ProfessionalAgendaAccessDto
> {
    constructor(
        private readonly agendaAccessRepository: ProfessionalAgendaAccessRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({
        actor,
        payload,
    }: Command<GrantProfessionalAgendaAccessPayload>): Promise<ProfessionalAgendaAccessDto> {
        const {professionalMemberId, reason} = payload;
        const granteeMemberId = ClinicMemberId.from(payload.granteeMemberId);

        if (granteeMemberId.toString() === professionalMemberId.toString()) {
            throw new InvalidInputException('A member cannot be granted agenda access to themselves.');
        }

        const [professional, grantee] = await Promise.all([
            this.clinicMemberRepository.findById(professionalMemberId),
            this.clinicMemberRepository.findById(granteeMemberId),
        ]);

        if (professional === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', professionalMemberId.toString());
        }

        if (grantee === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', granteeMemberId.toString());
        }

        if (!professional.clinicId.equals(actor.clinicId) || !grantee.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Members do not belong to the current clinic.');
        }

        const existing = await this.agendaAccessRepository.findByGranteeAndProfessional(
            granteeMemberId,
            professionalMemberId
        );

        let access: ProfessionalAgendaAccess;

        if (existing !== null) {
            existing.updateReason(reason ?? null);
            access = existing;
        } else {
            access = ProfessionalAgendaAccess.create({
                clinicId: professional.clinicId,
                granteeMemberId,
                professionalMemberId,
                reason: reason ?? null,
            });
        }

        await this.agendaAccessRepository.save(access);
        this.eventDispatcher.dispatch(actor, access);

        return new ProfessionalAgendaAccessDto(access);
    }
}
