import {Entity, type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';

export type ProfessionalConfigProps = EntityProps<ProfessionalConfig>;
export type CreateProfessionalConfig = CreateEntity<ProfessionalConfig>;
export type UpdateProfessionalConfig = Partial<ProfessionalConfigProps>;

export class ProfessionalConfig extends Entity<ProfessionalConfigId> {
    color: string | null;

    constructor(props: AllEntityProps<ProfessionalConfig>) {
        super(props);
        this.color = props.color ?? null;
        this.validate();
    }

    static create(props: CreateProfessionalConfig): ProfessionalConfig {
        const id = ProfessionalConfigId.generate();
        const now = new Date();

        const config = new ProfessionalConfig({
            ...props,
            id,
            color: props.color ?? null,
            createdAt: now,
            updatedAt: now,
        });

        return config;
    }

    change(props: UpdateProfessionalConfig): void {
        if (props.color !== undefined) {
            this.color = props.color;
        }

        this.validate();
        this.update();
    }

    validate(): void {
        // Add validation logic if needed
    }

    toJSON(): EntityJson<ProfessionalConfig> {
        return {
            id: this.id.toJSON(),
            color: this.color,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }
}

export class ProfessionalConfigId extends EntityId<'ProfessionalConfigId'> {
    static from(value: string): ProfessionalConfigId {
        return new ProfessionalConfigId(value);
    }

    static generate(): ProfessionalConfigId {
        return new ProfessionalConfigId();
    }
}

