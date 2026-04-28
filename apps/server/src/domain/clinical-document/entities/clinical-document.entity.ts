import {AggregateRoot, type AllEntityProps, type EntityProps, type EntityJson} from '../../@shared/entity';
import type {EntityProperties} from '../../@shared/entity/entity.types';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import type {ProfessionalId} from '../../professional/entities';
import type {PatientId} from '../../patient/entities';
import type {AppointmentId} from '../../appointment/entities';
import {PreconditionException} from '../../@shared/exceptions';
import {ClinicalDocumentGeneratedEvent} from '../events';
import type {ClinicalDocumentTemplateId} from './clinical-document-template.entity';

export enum ClinicalDocumentType {
    PRESCRIPTION = 'PRESCRIPTION',
    PRESCRIPTION_SPECIAL = 'PRESCRIPTION_SPECIAL',
    MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
    REFERRAL = 'REFERRAL',
    EXAM_REQUEST = 'EXAM_REQUEST',
}

export enum ClinicalDocumentStatus {
    DRAFT = 'DRAFT',
    GENERATED = 'GENERATED',
    CANCELLED = 'CANCELLED',
}

// ─── Content types ────────────────────────────────────────────────────────────

export type MedicationItem = {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
};

export type PrescriptionContent = {
    medications: MedicationItem[];
    observations?: string;
};

export type MedicalCertificateContent = {
    reason: string;
    daysOff: number;
    startDate: string;
    cid?: string;
    observations?: string;
};

export type ReferralUrgency = 'ROUTINE' | 'PRIORITY' | 'URGENT';

export type ReferralContent = {
    specialty: string;
    reason: string;
    urgency: ReferralUrgency;
    observations?: string;
};

export type ExamItem = {
    name: string;
    code?: string;
    justification?: string;
};

export type ExamRequestContent = {
    exams: ExamItem[];
    observations?: string;
    priority?: string;
};

export type ClinicalDocumentContent =
    | PrescriptionContent
    | MedicalCertificateContent
    | ReferralContent
    | ExamRequestContent;

// ─── Entity ───────────────────────────────────────────────────────────────────

export type ClinicalDocumentProps = EntityProps<ClinicalDocument>;
export type CreateClinicalDocument = Nullish<Omit<AllEntityProps<ClinicalDocument>, EntityProperties | 'status'>>;

export class ClinicalDocument extends AggregateRoot<ClinicalDocumentId> {
    clinicId: ClinicId;
    patientId: PatientId;
    createdByMemberId: ClinicMemberId;
    responsibleProfessionalId: ProfessionalId;
    type: ClinicalDocumentType;
    templateId: ClinicalDocumentTemplateId | null;
    contentJson: Record<string, unknown>;
    fileId: string | null;
    generatedAt: Date | null;
    status: ClinicalDocumentStatus;
    appointmentId: AppointmentId | null;
    recordId: string | null;

    constructor(props: AllEntityProps<ClinicalDocument>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.createdByMemberId = props.createdByMemberId;
        this.responsibleProfessionalId = props.responsibleProfessionalId;
        this.type = props.type;
        this.templateId = props.templateId ?? null;
        this.contentJson = props.contentJson;
        this.fileId = props.fileId ?? null;
        this.generatedAt = props.generatedAt ?? null;
        this.status = props.status;
        this.appointmentId = props.appointmentId ?? null;
        this.recordId = props.recordId ?? null;
    }

    static create(props: CreateClinicalDocument): ClinicalDocument {
        const now = new Date();

        return new ClinicalDocument({
            ...props,
            id: ClinicalDocumentId.generate(),
            templateId: props.templateId ?? null,
            fileId: null,
            generatedAt: null,
            status: ClinicalDocumentStatus.DRAFT,
            appointmentId: props.appointmentId ?? null,
            recordId: props.recordId ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    markGenerated(fileId: string, templateId: ClinicalDocumentTemplateId | null): void {
        if (this.status === ClinicalDocumentStatus.CANCELLED) {
            throw new PreconditionException('CLINICAL_DOCUMENT_CANCELLED');
        }

        if (this.status === ClinicalDocumentStatus.GENERATED) {
            throw new PreconditionException('CLINICAL_DOCUMENT_ALREADY_GENERATED');
        }

        const now = new Date();

        this.fileId = fileId;
        this.templateId = templateId;
        this.generatedAt = now;
        this.status = ClinicalDocumentStatus.GENERATED;
        this.updatedAt = now;
        this.addEvent(new ClinicalDocumentGeneratedEvent({document: this, timestamp: now}));
    }

    cancel(): void {
        if (this.status === ClinicalDocumentStatus.CANCELLED) {
            throw new PreconditionException('CLINICAL_DOCUMENT_ALREADY_CANCELLED');
        }

        const now = new Date();

        this.status = ClinicalDocumentStatus.CANCELLED;
        this.deletedAt = now;
        this.updatedAt = now;
    }

    toJSON(): EntityJson<ClinicalDocument> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            createdByMemberId: this.createdByMemberId.toJSON(),
            responsibleProfessionalId: this.responsibleProfessionalId.toJSON(),
            type: this.type,
            templateId: this.templateId?.toJSON() ?? null,
            contentJson: this.contentJson,
            fileId: this.fileId,
            generatedAt: this.generatedAt?.toJSON() ?? null,
            status: this.status,
            appointmentId: this.appointmentId?.toJSON() ?? null,
            recordId: this.recordId,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicalDocumentId extends EntityId<'ClinicalDocumentId'> {
    static from(value: string): ClinicalDocumentId {
        return new ClinicalDocumentId(value);
    }

    static generate(): ClinicalDocumentId {
        return new ClinicalDocumentId();
    }
}
