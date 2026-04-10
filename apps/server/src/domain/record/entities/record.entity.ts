import type {PersonId} from '@domain/person/entities';
import {
    AggregateRoot,
    type AllEntityProps,
    type EntityJson,
    type EntityProps,
    type CreateEntity,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ProfessionalId} from '../../professional/entities';
import type {AppointmentId} from '../../appointment/entities';
import {RecordCreatedEvent, RecordChangedEvent, RecordDeletedEvent} from '../events';
import type {File} from './file.entity';

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

export type RecordProps = EntityProps<Record>;
export type CreateRecord = CreateEntity<Record>;
export type UpdateRecord = Partial<RecordProps>;

export class Record extends AggregateRoot<RecordId> {
    patientId: PersonId;
    professionalId: ProfessionalId;
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

    constructor(props: AllEntityProps<Record>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
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
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        record.addEvent(new RecordCreatedEvent({record, timestamp: now}));

        return record;
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

        this.validate();

        this.addEvent(new RecordChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        // Validation
    }

    toJSON(): EntityJson<Record> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
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
