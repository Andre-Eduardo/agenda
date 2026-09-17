import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ProfessionalAgendaAccessDto} from '@application/professional-agenda-access/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

type ListProfessionalAgendaAccessPayload = {professionalMemberId: ClinicMemberId};

@Injectable()
export class ListProfessionalAgendaAccessService implements ApplicationService<
    ListProfessionalAgendaAccessPayload,
    ProfessionalAgendaAccessDto[]
> {
    constructor(
        private readonly agendaAccessRepository: ProfessionalAgendaAccessRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository
    ) {}

    async execute({
        actor,
        payload,
    }: Command<ListProfessionalAgendaAccessPayload>): Promise<ProfessionalAgendaAccessDto[]> {
        const {professionalMemberId} = payload;

        const professional = await this.clinicMemberRepository.findById(professionalMemberId);

        if (professional === null) {
            throw new ResourceNotFoundException('clinic_member.not_found', professionalMemberId.toString());
        }

        if (!professional.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Member does not belong to the current clinic.');
        }

        const grants = await this.agendaAccessRepository.findByProfessionalId(actor.clinicId, professionalMemberId);

        return grants.map((grant) => new ProfessionalAgendaAccessDto(grant));
    }
}
