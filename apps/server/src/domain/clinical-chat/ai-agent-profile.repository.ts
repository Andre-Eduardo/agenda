import type {AiAgentProfile, AiAgentProfileId} from '@domain/clinical-chat/entities';
import type {AiSpecialtyGroup} from '@domain/form-template/entities';

export interface AiAgentProfileRepository {
    findById(id: AiAgentProfileId): Promise<AiAgentProfile | null>;
    findBySlug(slug: string): Promise<AiAgentProfile | null>;
    findBySpecialty(specialty: AiSpecialtyGroup): Promise<AiAgentProfile | null>;
    findAllActive(): Promise<AiAgentProfile[]>;
    save(profile: AiAgentProfile): Promise<void>;
}

export abstract class AiAgentProfileRepository {}
