import type {Specialty} from '../form-template/entities';
import type {AiAgentProfile, AiAgentProfileId} from './entities';

export interface AiAgentProfileRepository {
    findById(id: AiAgentProfileId): Promise<AiAgentProfile | null>;
    findBySlug(slug: string): Promise<AiAgentProfile | null>;
    findBySpecialty(specialty: Specialty): Promise<AiAgentProfile | null>;
    findAllActive(): Promise<AiAgentProfile[]>;
    save(profile: AiAgentProfile): Promise<void>;
}

export abstract class AiAgentProfileRepository {}
