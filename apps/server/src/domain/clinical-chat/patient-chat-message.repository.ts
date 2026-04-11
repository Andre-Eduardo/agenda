import {PaginatedList, Pagination} from '../@shared/repository';
import type {PatientChatMessage, PatientChatMessageId, PatientChatSessionId, ChatMessageRole} from './entities';

export type PatientChatMessageFilter = {
    sessionId?: PatientChatSessionId;
    role?: ChatMessageRole;
};

export type PatientChatMessageSortOptions = ['createdAt'];

export interface PatientChatMessageRepository {
    findById(id: PatientChatMessageId): Promise<PatientChatMessage | null>;

    listBySession(
        sessionId: PatientChatSessionId,
        pagination: Pagination<PatientChatMessageSortOptions>
    ): Promise<PaginatedList<PatientChatMessage>>;

    save(message: PatientChatMessage): Promise<void>;
}

export abstract class PatientChatMessageRepository {}
