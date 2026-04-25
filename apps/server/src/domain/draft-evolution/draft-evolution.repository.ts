import type {DraftEvolution, DraftEvolutionId} from './entities/draft-evolution.entity';
import type {ImportedDocumentId} from '../record/entities/imported-document.entity';

export interface DraftEvolutionRepository {
    findById(id: DraftEvolutionId): Promise<DraftEvolution | null>;
    findByImportedDocumentId(importedDocumentId: ImportedDocumentId): Promise<DraftEvolution | null>;
    save(draft: DraftEvolution): Promise<void>;
}

export abstract class DraftEvolutionRepository {}
