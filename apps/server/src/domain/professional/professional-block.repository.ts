import type {ProfessionalBlock, ProfessionalBlockId} from './entities';
import type {ProfessionalId} from './entities';

export interface ProfessionalBlockRepository {
    findById(id: ProfessionalBlockId): Promise<ProfessionalBlock | null>;

    findOverlapping(professionalId: ProfessionalId, startAt: Date, endAt: Date): Promise<ProfessionalBlock[]>;

    save(block: ProfessionalBlock): Promise<void>;

    delete(id: ProfessionalBlockId): Promise<void>;
}

export abstract class ProfessionalBlockRepository {}
