import {AggregateRoot, type AllEntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {PreconditionException} from '../../@shared/exceptions';
import type {PatientId} from '../../patient/entities';
import type {ProfessionalId} from '../../professional/entities';
import type {FormTemplateId} from '../../form-template/entities';
import type {FormTemplateVersionId} from '../../form-template-version/entities';
import type {FormResponseJson, FormComputedJson} from '../../form-template/types';
import {PatientFormCompletedEvent} from '../events';

export enum FormResponseStatus {
    DRAFT = 'DRAFT',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export type CreatePatientForm = CreateEntity<PatientForm>;

export class PatientForm extends AggregateRoot<PatientFormId> {
    patientId: PatientId;
    professionalId: ProfessionalId;
    templateId: FormTemplateId;
    versionId: FormTemplateVersionId;
    status: FormResponseStatus;
    responseJson: FormResponseJson;
    computedJson: FormComputedJson | null;
    appliedAt: Date;
    completedAt: Date | null;

    constructor(props: AllEntityProps<PatientForm>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.templateId = props.templateId;
        this.versionId = props.versionId;
        this.status = props.status ?? FormResponseStatus.IN_PROGRESS;
        this.responseJson = props.responseJson ?? {answers: []};
        this.computedJson = props.computedJson ?? null;
        this.appliedAt = props.appliedAt;
        this.completedAt = props.completedAt ?? null;
    }

    static create(props: CreatePatientForm): PatientForm {
        const now = new Date();
        return new PatientForm({
            ...props,
            id: PatientFormId.generate(),
            status: props.status ?? FormResponseStatus.IN_PROGRESS,
            responseJson: props.responseJson ?? {answers: []},
            computedJson: null,
            appliedAt: props.appliedAt ?? now,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    saveDraft(responseJson: FormResponseJson): void {
        if (this.status === FormResponseStatus.COMPLETED) {
            throw new PreconditionException('Cannot edit a completed form.');
        }
        if (this.status === FormResponseStatus.CANCELLED) {
            throw new PreconditionException('Cannot edit a cancelled form.');
        }
        this.responseJson = responseJson;
        this.status = FormResponseStatus.DRAFT;
        this.updatedAt = new Date();
    }

    complete(responseJson: FormResponseJson, computedJson?: FormComputedJson): void {
        if (this.status === FormResponseStatus.COMPLETED) {
            throw new PreconditionException('Form is already completed.');
        }
        if (this.status === FormResponseStatus.CANCELLED) {
            throw new PreconditionException('Cannot complete a cancelled form.');
        }
        const now = new Date();
        this.responseJson = responseJson;
        this.computedJson = computedJson ?? null;
        this.status = FormResponseStatus.COMPLETED;
        this.completedAt = now;
        this.updatedAt = now;
        this.addEvent(new PatientFormCompletedEvent({formId: this.id, patientId: this.patientId, timestamp: now}));
    }

    cancel(): void {
        if (this.status === FormResponseStatus.COMPLETED) {
            throw new PreconditionException('Cannot cancel a completed form.');
        }
        this.status = FormResponseStatus.CANCELLED;
        this.updatedAt = new Date();
    }

    setComputedJson(computedJson: FormComputedJson): void {
        this.computedJson = computedJson;
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            templateId: this.templateId.toJSON(),
            versionId: this.versionId.toJSON(),
            status: this.status,
            responseJson: this.responseJson,
            computedJson: this.computedJson,
            appliedAt: this.appliedAt.toJSON(),
            completedAt: this.completedAt?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientFormId extends EntityId<'PatientFormId'> {
    static from(value: string): PatientFormId {
        return new PatientFormId(value);
    }

    static generate(): PatientFormId {
        return new PatientFormId();
    }
}
