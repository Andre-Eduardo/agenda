import type {
  ImportedDocument,
  ImportedDocumentId,
} from "@domain/record/entities/imported-document.entity";

export interface ImportedDocumentRepository {
  findById(id: ImportedDocumentId): Promise<ImportedDocument | null>;
  save(document: ImportedDocument): Promise<void>;
}

export abstract class ImportedDocumentRepository {}
