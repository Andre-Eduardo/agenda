import type {ImportedDocument, ImportedDocumentId} from './entities/imported-document.entity';

export interface ImportedDocumentRepository {
    findById(id: ImportedDocumentId): Promise<ImportedDocument | null>;
    save(document: ImportedDocument): Promise<void>;
}

export abstract class ImportedDocumentRepository {}
