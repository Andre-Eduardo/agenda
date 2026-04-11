import {Injectable} from '@nestjs/common';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {ChatSessionStatus} from '../../../domain/clinical-chat/entities';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {PaginatedList, Pagination} from '../../../domain/@shared/repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import type {PatientChatSession} from '../../../domain/clinical-chat/entities';

export type ListChatSessionsInput = Pagination<['createdAt', 'updatedAt', 'lastActivityAt']> & {
    patientId?: PatientId;
    professionalId?: ProfessionalId;
    status?: ChatSessionStatus;
};

@Injectable()
export class ListChatSessionsService
    implements ApplicationService<ListChatSessionsInput, PaginatedList<PatientChatSession>>
{
    constructor(private readonly sessionRepository: PatientChatSessionRepository) {}

    async execute({payload}: Command<ListChatSessionsInput>): Promise<PaginatedList<PatientChatSession>> {
        const {patientId, professionalId, status, ...pagination} = payload;

        return this.sessionRepository.search(pagination, {patientId, professionalId, status});
    }
}
