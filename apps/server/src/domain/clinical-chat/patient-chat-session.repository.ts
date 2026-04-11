import {PaginatedList, Pagination} from '../@shared/repository';
import type {PatientId} from '../patient/entities';
import type {ProfessionalId} from '../professional/entities';
import type {PatientChatSession, PatientChatSessionId, ChatSessionStatus} from './entities';

export type PatientChatSessionFilter = {
    patientId?: PatientId;
    professionalId?: ProfessionalId;
    status?: ChatSessionStatus;
};

export type PatientChatSessionSortOptions = [
    'createdAt',
    'updatedAt',
    'lastActivityAt',
];

export interface PatientChatSessionRepository {
    findById(id: PatientChatSessionId): Promise<PatientChatSession | null>;

    search(
        pagination: Pagination<PatientChatSessionSortOptions>,
        filter?: PatientChatSessionFilter
    ): Promise<PaginatedList<PatientChatSession>>;

    save(session: PatientChatSession): Promise<void>;

    delete(id: PatientChatSessionId): Promise<void>;
}

export abstract class PatientChatSessionRepository {}
