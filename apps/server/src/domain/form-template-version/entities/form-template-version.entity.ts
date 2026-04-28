import {AggregateRoot, type AllEntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {FormTemplateId} from '../../form-template/entities';
import type {FormDefinitionJson} from '../../form-template/types';

export enum FormStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    DEPRECATED = 'DEPRECATED',
}

export type CreateFormTemplateVersion = CreateEntity<FormTemplateVersion>;

export class FormTemplateVersion extends AggregateRoot<FormTemplateVersionId> {
    templateId: FormTemplateId;
    versionNumber: number;
    status: FormStatus;
    definitionJson: FormDefinitionJson;
    schemaJson: unknown | null;
    publishedAt: Date | null;

    constructor(props: AllEntityProps<FormTemplateVersion>) {
        super(props);
        this.templateId = props.templateId;
        this.versionNumber = props.versionNumber;
        this.status = props.status ?? FormStatus.DRAFT;
        this.definitionJson = props.definitionJson;
        this.schemaJson = props.schemaJson ?? null;
        this.publishedAt = props.publishedAt ?? null;
    }

    static create(props: CreateFormTemplateVersion): FormTemplateVersion {
        const now = new Date();

        return new FormTemplateVersion({
            ...props,
            id: FormTemplateVersionId.generate(),
            status: props.status ?? FormStatus.DRAFT,
            schemaJson: props.schemaJson ?? null,
            publishedAt: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    publish(): void {
        if (this.status === FormStatus.PUBLISHED) return;
        this.status = FormStatus.PUBLISHED;
        this.publishedAt = new Date();
        this.updatedAt = new Date();
    }

    deprecate(): void {
        if (this.status === FormStatus.DEPRECATED) return;
        this.status = FormStatus.DEPRECATED;
        this.updatedAt = new Date();
    }

    isDraft(): boolean {
        return this.status === FormStatus.DRAFT;
    }

    isPublished(): boolean {
        return this.status === FormStatus.PUBLISHED;
    }

    toJSON() {
        return {
            id: this.id.toJSON(),
            templateId: this.templateId.toJSON(),
            versionNumber: this.versionNumber,
            status: this.status,
            definitionJson: this.definitionJson,
            schemaJson: this.schemaJson,
            publishedAt: this.publishedAt?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class FormTemplateVersionId extends EntityId<'FormTemplateVersionId'> {
    static from(value: string): FormTemplateVersionId {
        return new FormTemplateVersionId(value);
    }

    static generate(): FormTemplateVersionId {
        return new FormTemplateVersionId();
    }
}
