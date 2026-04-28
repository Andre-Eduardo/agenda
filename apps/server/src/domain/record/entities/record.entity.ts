import {PersonId} from '../../person/entities/person.entity';
import {
    AggregateRoot,
    type AllEntityProps,
    type EntityJson,
    type EntityProps,
    type CreateEntity,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import type {ProfessionalId} from '../../professional/entities';
import type {AppointmentId} from '../../appointment/entities';
import {RecordCreatedEvent, RecordChangedEvent, RecordDeletedEvent, RecordSavedEvent, RecordSignedEvent, RecordReopenedEvent} from '../events';
import type {File} from './file.entity';
import {ImportedDocumentId} from './imported-document.entity';
import {PreconditionException} from '../../@shared/exceptions';

export enum EvolutionTemplateType {
    SOAP = 'SOAP',
    DAP = 'DAP',
}

export enum AttendanceType {
    FIRST_VISIT = 'FIRST_VISIT',
    FOLLOW_UP = 'FOLLOW_UP',
    EVALUATION = 'EVALUATION',
    PROCEDURE = 'PROCEDURE',
    TELEMEDICINE = 'TELEMEDICINE',
    INTERCURRENCE = 'INTERCURRENCE',
}

export enum ClinicalStatusTag {
    STABLE = 'STABLE',
    IMPROVING = 'IMPROVING',
    WORSENING = 'WORSENING',
    UNCHANGED = 'UNCHANGED',
    UNDER_OBSERVATION = 'UNDER_OBSERVATION',
}

export enum ConductTag {
    GUIDANCE = 'GUIDANCE',
    PRESCRIPTION = 'PRESCRIPTION',
    EXAM_REQUESTED = 'EXAM_REQUESTED',
    REFERRAL = 'REFERRAL',
    FOLLOW_UP_SCHEDULED = 'FOLLOW_UP_SCHEDULED',
    THERAPY_ADJUSTMENT = 'THERAPY_ADJUSTMENT',
}

export enum RecordSource {
    MANUAL = 'MANUAL',
    IMPORT = 'IMPORT',
}

export type RecordProps = EntityProps<Record>;
export type CreateRecord = CreateEntity<Record>;
export type UpdateRecord = Partial<RecordProps>;

export class Record extends AggregateRoot<RecordId> {
    clinicId: ClinicId;
    patientId: PersonId;
    /** Membro que digitou/criou o registro. */
    createdByMemberId: ClinicMemberId;
    /** Profissional clinicamente responsável (≠ quem digitou). */
    responsibleProfessionalId: ProfessionalId;
    description: string | null;
    templateType: EvolutionTemplateType | null;
    title: string | null;
    attendanceType: AttendanceType | null;
    clinicalStatus: ClinicalStatusTag | null;
    conductTags: ConductTag[];
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    freeNotes: string | null;
    eventDate: Date | null;
    appointmentId: AppointmentId | null;
    files: File[];
    source: RecordSource;
    importedDocumentId: ImportedDocumentId | null;
    wasHumanEdited: boolean;
    patientFormId: string | null;
    isLocked: boolean;
    signedAt: Date | null;
    signedByMemberId: ClinicMemberId | null;

    constructor(props: AllEntityProps<Record>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.createdByMemberId = props.createdByMemberId;
        this.responsibleProfessionalId = props.responsibleProfessionalId;
        this.description = props.description ?? null;
        this.templateType = props.templateType ?? null;
        this.title = props.title ?? null;
        this.attendanceType = props.attendanceType ?? null;
        this.clinicalStatus = props.clinicalStatus ?? null;
        this.conductTags = props.conductTags ?? [];
        this.subjective = props.subjective ?? null;
        this.objective = props.objective ?? null;
        this.assessment = props.assessment ?? null;
        this.plan = props.plan ?? null;
        this.freeNotes = props.freeNotes ?? null;
        this.eventDate = props.eventDate ?? null;
        this.appointmentId = props.appointmentId ?? null;
        this.files = props.files;
        this.source = props.source ?? RecordSource.MANUAL;
        this.importedDocumentId = props.importedDocumentId ?? null;
        this.wasHumanEdited = props.wasHumanEdited ?? false;
        this.patientFormId = props.patientFormId ?? null;
        this.isLocked = props.isLocked ?? false;
        this.signedAt = props.signedAt ?? null;
        this.signedByMemberId = props.signedByMemberId ?? null;
        this.validate();
    }

    static create(props: CreateRecord): Record {
        const now = new Date();

        const record = new Record({
            ...props,
            id: RecordId.generate(),
            description: props.description ?? null,
            templateType: props.templateType ?? null,
            title: props.title ?? null,
            attendanceType: props.attendanceType ?? null,
            clinicalStatus: props.clinicalStatus ?? null,
            conductTags: props.conductTags ?? [],
            subjective: props.subjective ?? null,
            objective: props.objective ?? null,
            assessment: props.assessment ?? null,
            plan: props.plan ?? null,
            freeNotes: props.freeNotes ?? null,
            eventDate: props.eventDate ?? null,
            appointmentId: props.appointmentId ?? null,
            files: props.files ?? [],
            source: props.source ?? RecordSource.MANUAL,
            importedDocumentId: props.importedDocumentId ?? null,
            wasHumanEdited: props.wasHumanEdited ?? false,
            patientFormId: props.patientFormId ?? null,
            isLocked: false,
            signedAt: null,
            signedByMemberId: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        record.addEvent(new RecordCreatedEvent({record, timestamp: now}));
        record.addEvent(new RecordSavedEvent({recordId: record.id, patientId: record.patientId, action: 'CREATED', timestamp: now}));

        return record;
    }

    sign(memberId: ClinicMemberId): void {
        if (this.isLocked) {
            throw new PreconditionException('RECORD_ALREADY_LOCKED');
        }

        const now = new Date();

        this.isLocked = true;
        this.signedAt = now;
        this.signedByMemberId = memberId;
        this.updatedAt = now;
        this.addEvent(new RecordSignedEvent({recordId: this.id, signedByMemberId: memberId, timestamp: now}));
    }

    unlock(requestedByMemberId: ClinicMemberId): void {
        if (!this.isLocked) {
            throw new PreconditionException('RECORD_NOT_LOCKED');
        }

        const now = new Date();

        this.isLocked = false;
        this.updatedAt = now;
        this.addEvent(new RecordReopenedEvent({recordId: this.id, requestedByMemberId, timestamp: now}));
    }

    delete(): void {
        this.addEvent(new RecordDeletedEvent({record: this}));
    }

    change(props: UpdateRecord): void {
        const oldState = new Record(this);

        if (props.description !== undefined) {
            this.description = props.description;
        }

        if (props.templateType !== undefined) {
            this.templateType = props.templateType;
        }

        if (props.title !== undefined) {
            this.title = props.title;
        }

        if (props.attendanceType !== undefined) {
            this.attendanceType = props.attendanceType;
        }

        if (props.clinicalStatus !== undefined) {
            this.clinicalStatus = props.clinicalStatus;
        }

        if (props.conductTags !== undefined) {
            this.conductTags = props.conductTags;
        }

        if (props.subjective !== undefined) {
            this.subjective = props.subjective;
        }

        if (props.objective !== undefined) {
            this.objective = props.objective;
        }

        if (props.assessment !== undefined) {
            this.assessment = props.assessment;
        }

        if (props.plan !== undefined) {
            this.plan = props.plan;
        }

        if (props.freeNotes !== undefined) {
            this.freeNotes = props.freeNotes;
        }

        if (props.eventDate !== undefined) {
            this.eventDate = props.eventDate;
        }

        if (props.appointmentId !== undefined) {
            this.appointmentId = props.appointmentId;
        }

        if (props.source !== undefined) {
            this.source = props.source;
        }

        if (props.importedDocumentId !== undefined) {
            this.importedDocumentId = props.importedDocumentId;
        }

        if (props.wasHumanEdited !== undefined) {
            this.wasHumanEdited = props.wasHumanEdited;
        }

        this.validate();

        this.addEvent(new RecordChangedEvent({oldState, newState: this}));
        this.addEvent(new RecordSavedEvent({recordId: this.id, patientId: this.patientId, action: 'UPDATED', timestamp: new Date()}));
    }

    validate(): void {
        // Validation
    }

    toJSON(): EntityJson<Record> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            createdByMemberId: this.createdByMemberId.toJSON(),
            responsibleProfessionalId: this.responsibleProfessionalId.toJSON(),
            description: this.description,
            templateType: this.templateType,
            title: this.title,
            attendanceType: this.attendanceType,
            clinicalStatus: this.clinicalStatus,
            conductTags: this.conductTags,
            subjective: this.subjective,
            objective: this.objective,
            assessment: this.assessment,
            plan: this.plan,
            freeNotes: this.freeNotes,
            eventDate: this.eventDate?.toJSON() ?? null,
            appointmentId: this.appointmentId?.toJSON() ?? null,
            files: this.files.map((f) => f.toJSON()),
            source: this.source,
            importedDocumentId: this.importedDocumentId?.toJSON() ?? null,
            wasHumanEdited: this.wasHumanEdited,
            patientFormId: this.patientFormId,
            isLocked: this.isLocked,
            signedAt: this.signedAt?.toJSON() ?? null,
            signedByMemberId: this.signedByMemberId?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class RecordId extends EntityId<'RecordId'> {
    static from(value: string): RecordId {
        return new RecordId(value);
    }

    static generate(): RecordId {
        return new RecordId();
    }
}