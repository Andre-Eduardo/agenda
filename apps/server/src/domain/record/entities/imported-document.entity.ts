import {EntityId} from '../../@shared/entity/id';
import {AggregateRoot, type AllEntityProps, type EntityJson, type CreateEntity} from '../../@shared/entity';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import {PersonId} from '../../person/entities/person.entity';
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
    clinicId: ClinicId;
    patientId: PersonId;
    /** Membro que importou o documento (substitui professionalId). */
    createdByMemberId: ClinicMemberId;
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
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.createdByMemberId = props.createdByMemberId;
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
            clinicId: props.clinicId!,
            patientId: props.patientId!,
            createdByMemberId: props.createdByMemberId!,
            fileId: props.fileId!,
            status: props.status ?? ImportStatus.UPLOADED,
            reviewRequired: props.reviewRequired ?? true,
            documentType: props.documentType ?? null,
            qualityLabel: props.qualityLabel ?? null,
            qualityScore: props.qualityScore ?? null,
            rawOcrText: props.rawOcrText ?? null,
            normalizedOcrText: props.normalizedOcrText ?? null,
            ocrConfidence: props.ocrConfidence ?? null,
            aiConfidence: props.aiConfidence ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    updateStatus(status: ImportStatus): void {
        this.status = status;
        this.updatedAt = new Date();
    }

    toJSON(): EntityJson<ImportedDocument> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            createdByMemberId: this.createdByMemberId.toJSON(),
            fileId: this.fileId.toJSON(),
            status: this.status,
            reviewRequired: this.reviewRequired,
            documentType: this.documentType,
            qualityLabel: this.qualityLabel,
            qualityScore: this.qualityScore,
            rawOcrText: this.rawOcrText,
            normalizedOcrText: this.normalizedOcrText,
            ocrConfidence: this.ocrConfidence,
            aiConfidence: this.aiConfidence,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
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
