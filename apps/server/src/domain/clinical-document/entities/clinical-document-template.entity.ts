import {AggregateRoot, type AllEntityProps, type EntityProps, type CreateEntity, type EntityJson} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import {ClinicalDocumentType} from './clinical-document.entity';

export type ClinicalDocumentTemplateProps = EntityProps<ClinicalDocumentTemplate>;
export type CreateClinicalDocumentTemplate = CreateEntity<ClinicalDocumentTemplate>;

export type LayoutJson = Record<string, unknown>;

export class ClinicalDocumentTemplate extends AggregateRoot<ClinicalDocumentTemplateId> {
    clinicId: ClinicId | null;
    type: ClinicalDocumentType;
    isDefault: boolean;
    name: string;
    layoutJson: LayoutJson;

    constructor(props: AllEntityProps<ClinicalDocumentTemplate>) {
        super(props);
        this.clinicId = props.clinicId;
        this.type = props.type;
        this.isDefault = props.isDefault;
        this.name = props.name;
        this.layoutJson = props.layoutJson;
    }

    static create(props: CreateClinicalDocumentTemplate): ClinicalDocumentTemplate {
        const now = new Date();

        return new ClinicalDocumentTemplate({
            ...props,
            id: ClinicalDocumentTemplateId.generate(),
            clinicId: props.clinicId ?? null,
            isDefault: props.isDefault ?? false,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    change(props: Partial<Pick<ClinicalDocumentTemplate, 'name' | 'layoutJson'>>): void {
        if (props.name !== undefined) this.name = props.name;

        if (props.layoutJson !== undefined) this.layoutJson = props.layoutJson;
        this.updatedAt = new Date();
    }

    toJSON(): EntityJson<ClinicalDocumentTemplate> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId?.toJSON() ?? null,
            type: this.type,
            isDefault: this.isDefault,
            name: this.name,
            layoutJson: this.layoutJson,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicalDocumentTemplateId extends EntityId<'ClinicalDocumentTemplateId'> {
    static from(value: string): ClinicalDocumentTemplateId {
        return new ClinicalDocumentTemplateId(value);
    }

    static generate(): ClinicalDocumentTemplateId {
        return new ClinicalDocumentTemplateId();
    }
}
