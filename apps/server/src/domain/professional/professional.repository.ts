import type {Professional, ProfessionalId} from './entities';

export interface ProfessionalRepository {
    findById(id: ProfessionalId): Promise<Professional | null>;
    delete(id: ProfessionalId): Promise<void>;
}

export abstract class ProfessionalRepository {}
