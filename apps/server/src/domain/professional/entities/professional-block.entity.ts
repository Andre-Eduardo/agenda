import {type AllEntityProps, type EntityProps, type CreateEntity, Entity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ProfessionalId} from './professional.entity';

export type ProfessionalBlockProps = EntityProps<ProfessionalBlock>;
export type CreateProfessionalBlock = CreateEntity<ProfessionalBlock>;

export class ProfessionalBlock extends Entity<ProfessionalBlockId> {
    professionalId: ProfessionalId;
    startAt: Date;
    endAt: Date;
    reason: string | null;

    constructor(props: AllEntityProps<ProfessionalBlock>) {
        super(props);
        this.professionalId = props.professionalId;
        this.startAt = props.startAt;
        this.endAt = props.endAt;
        this.reason = props.reason ?? null;
    }

    static create(props: CreateProfessionalBlock): ProfessionalBlock {
        const now = new Date();

        return new ProfessionalBlock({
            ...props,
            id: ProfessionalBlockId.generate(),
            reason: props.reason ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    toJSON() {
        return {
            id: this.id.toJSON(),
            professionalId: this.professionalId.toJSON(),
            startAt: this.startAt.toJSON(),
            endAt: this.endAt.toJSON(),
            reason: this.reason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }

    overlaps(startAt: Date, endAt: Date): boolean {
        return this.startAt < endAt && this.endAt > startAt;
    }
}

export class ProfessionalBlockId extends EntityId<'ProfessionalBlockId'> {
    static from(value: string): ProfessionalBlockId {
        return new ProfessionalBlockId(value);
    }

    static generate(): ProfessionalBlockId {
        return new ProfessionalBlockId();
    }
}
