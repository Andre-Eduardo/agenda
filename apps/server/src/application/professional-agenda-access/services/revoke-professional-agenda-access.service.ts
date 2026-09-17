import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {EventDispatcher} from '@domain/event';
import {ProfessionalAgendaAccessRepository} from '@domain/professional-agenda-access/professional-agenda-access.repository';

export type RevokeProfessionalAgendaAccessInput = {
    professionalMemberId: ClinicMemberId;
    granteeMemberId: ClinicMemberId;
};

@Injectable()
export class RevokeProfessionalAgendaAccessService implements ApplicationService<RevokeProfessionalAgendaAccessInput> {
    constructor(
        private readonly agendaAccessRepository: ProfessionalAgendaAccessRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<RevokeProfessionalAgendaAccessInput>): Promise<void> {
        const access = await this.agendaAccessRepository.findByGranteeAndProfessional(
            payload.granteeMemberId,
            payload.professionalMemberId
        );

        if (access === null) return;

        access.revoke();
        await this.agendaAccessRepository.save(access);
        this.eventDispatcher.dispatch(actor, access);
    }
}
