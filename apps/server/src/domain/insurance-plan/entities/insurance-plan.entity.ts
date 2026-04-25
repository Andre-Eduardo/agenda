import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';

export type InsurancePlanProps = EntityProps<InsurancePlan>;
export type CreateInsurancePlan = CreateEntity<InsurancePlan>;
export type UpdateInsurancePlan = Partial<InsurancePlanProps>;

export class InsurancePlan extends AggregateRoot<InsurancePlanId> {
    clinicId: ClinicId;
    name: string;
    code: string | null;
    isActive: boolean;

    constructor(props: AllEntityProps<InsurancePlan>) {
        super(props);
        this.clinicId = props.clinicId;
        this.name = props.name;
        this.code = props.code ?? null;
        this.isActive = props.isActive ?? true;
    }

    static create(props: CreateInsurancePlan): InsurancePlan {
        const now = new Date();

        return new InsurancePlan({
            ...props,
            id: InsurancePlanId.generate(),
            clinicId: props.clinicId,
            name: props.name,
            code: props.code ?? null,
            isActive: props.isActive ?? true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    deactivate(): void {
        this.isActive = false;
        this.update();
    }

    toJSON(): EntityJson<InsurancePlan> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            name: this.name,
            code: this.code,
            isActive: this.isActive,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class InsurancePlanId extends EntityId<'InsurancePlanId'> {
    static from(value: string): InsurancePlanId {
        return new InsurancePlanId(value);
    }

    static generate(): InsurancePlanId {
        return new InsurancePlanId();
    }
}
