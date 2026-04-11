import type {ClinicalChatInteractionLog, ClinicalChatInteractionLogId} from './entities';
import type {PatientChatSessionId} from './entities';

export interface ClinicalChatInteractionLogRepository {
    findById(id: ClinicalChatInteractionLogId): Promise<ClinicalChatInteractionLog | null>;

    /** Lista todos os logs de uma sessão, ordenados por createdAt desc. */
    findBySessionId(sessionId: PatientChatSessionId): Promise<ClinicalChatInteractionLog[]>;

    save(log: ClinicalChatInteractionLog): Promise<void>;
}

export abstract class ClinicalChatInteractionLogRepository {}
