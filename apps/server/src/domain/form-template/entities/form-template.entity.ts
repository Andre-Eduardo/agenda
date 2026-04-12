import {AggregateRoot, type AllEntityProps, type CreateEntity, type EntityProps, type EntityJson} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ProfessionalId} from '../../professional/entities';

export enum Specialty {
    PSICOLOGIA = 'PSICOLOGIA',
    MEDICINA = 'MEDICINA',
    FISIOTERAPIA = 'FISIOTERAPIA',
    FONOAUDIOLOGIA = 'FONOAUDIOLOGIA',
    NUTRICAO = 'NUTRICAO',
    TERAPIA_OCUPACIONAL = 'TERAPIA_OCUPACIONAL',
    ENFERMAGEM = 'ENFERMAGEM',
    OUTROS = 'OUTROS',
}

export type FormTemplateProps = EntityProps<FormTemplate>;
export type CreateFormTemplate = CreateEntity<FormTemplate>;

export class FormTemplate extends AggregateRoot<FormTemplateId> {
    code: string;
    name: string;
    description: string | null;
    specialty: Specialty;
    isPublic: boolean;
    professionalId: ProfessionalId | null;

    constructor(props: AllEntityProps<FormTemplate>) {
        super(props);
        this.code = props.code;
        this.name = props.name;
        this.description = props.description ?? null;
        this.specialty = props.specialty;
        this.isPublic = props.isPublic ?? false;
        this.professionalId = props.professionalId ?? null;
    }

    static create(props: CreateFormTemplate): FormTemplate {
        const now = new Date();
        return new FormTemplate({
            ...props,
            id: FormTemplateId.generate(),
            description: props.description ?? null,
            isPublic: props.isPublic ?? false,
            professionalId: props.professionalId ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    change(props: Partial<Pick<FormTemplateProps, 'name' | 'description'>>): void {
        if (props.name !== undefined) this.name = props.name;
        if (props.description !== undefined) this.description = props.description;
        this.updatedAt = new Date();
    }

    softDelete(): void {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }

    toJSON(): EntityJson<FormTemplate> {
        return {
            id: this.id.toJSON(),
            code: this.code,
            name: this.name,
            description: this.description,
            specialty: this.specialty,
            isPublic: this.isPublic,
            professionalId: this.professionalId?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class FormTemplateId extends EntityId<'FormTemplateId'> {
    static from(value: string): FormTemplateId {
        return new FormTemplateId(value);
    }

    static generate(): FormTemplateId {
        return new FormTemplateId();
    }
}
