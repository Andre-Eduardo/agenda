import type {
  DraftEvolution,
  DraftEvolutionId,
} from "@domain/draft-evolution/entities/draft-evolution.entity";
import type { ImportedDocumentId } from "@domain/record/entities/imported-document.entity";

export interface DraftEvolutionRepository {
  findById(id: DraftEvolutionId): Promise<DraftEvolution | null>;
  findByImportedDocumentId(importedDocumentId: ImportedDocumentId): Promise<DraftEvolution | null>;
  save(draft: DraftEvolution): Promise<void>;
}

export abstract class DraftEvolutionRepository {}
