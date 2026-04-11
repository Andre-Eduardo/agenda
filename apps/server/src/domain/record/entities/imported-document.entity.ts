import {EntityId} from '../../@shared/entity/id';
import {AggregateRoot, type AllEntityProps, type EntityJson, type CreateEntity} from '../../@shared/entity';
import type {PersonId} from '../../patient/entities';
import type {ProfessionalId} from '../../professional/entities';
import type {FileId} from './file.entity';

export enum ImportStatus {
    UPLOADED = 'UPLOADED',
    QUALITY_CHECKED = 'QUALITY_CHECKED',
    PREPROCESSED = 'PREPROCESSED',
    OCR_DONE = 'OCR_DONE',
    NORMALIZED = 'NORMALIZED',
    CLASSIFIED = 'CLASSIFIED',
    AI_STRUCTURED = 'AI_STRUCTURED',
    READY_FOR_REVIEW = 'READY_FOR_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    FAILED = 'FAILED',
}

export class ImportedDocument extends AggregateRoot<ImportedDocumentId> {
    patientId: PersonId;
    professionalId: ProfessionalId;
    fileId: FileId;
    
    // Campos de metadados da IA/OCR
    documentType: string | null;
    qualityLabel: string | null;
    qualityScore: number | null;
    rawOcrText: string | null;
    normalizedOcrText: string | null;
    ocrConfidence: number | null;
    aiConfidence: number | null;
    
    // Controle de Fluxo
    status: ImportStatus;
    reviewRequired: boolean;

    constructor(props: AllEntityProps<ImportedDocument>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.fileId = props.fileId;
        this.documentType = props.documentType ?? null;
        this.qualityLabel = props.qualityLabel ?? null;
        this.qualityScore = props.qualityScore ?? null;
        this.rawOcrText = props.rawOcrText ?? null;
        this.normalizedOcrText = props.normalizedOcrText ?? null;
        this.ocrConfidence = props.ocrConfidence ?? null;
        this.aiConfidence = props.aiConfidence ?? null;
        this.status = props.status ?? ImportStatus.UPLOADED;
        this.reviewRequired = props.reviewRequired ?? true;
    }

    static create(props: CreateEntity<ImportedDocument>): ImportedDocument {
        const now = new Date();
        return new ImportedDocument({
            ...props,
            id: ImportedDocumentId.generate(),
            status: props.status ?? ImportStatus.UPLOADED,
            reviewRequired: props.reviewRequired ?? true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    toJSON(): EntityJson<ImportedDocument> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            fileId: this.fileId.toJSON(),
            status: this.status,
            reviewRequired: this.reviewRequired,
            ocrConfidence: this.ocrConfidence,
            aiConfidence: this.aiConfidence,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }
}

export class ImportedDocumentId extends EntityId<'ImportedDocumentId'> {
    static from(value: string): ImportedDocumentId {
        return new ImportedDocumentId(value);
    }
    static generate(): ImportedDocumentId {
        return new ImportedDocumentId();
    }
}
