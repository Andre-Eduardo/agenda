import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {ClinicId} from '@domain/clinic/entities';

export type PatientSubscriptionPlanProps = EntityProps<PatientSubscriptionPlan>;
export type CreatePatientSubscriptionPlan = Omit<CreateEntity<PatientSubscriptionPlan>, 'isActive'>;
export type UpdatePatientSubscriptionPlan = {
    name?: string;
    description?: string | null;
    monthlyAppointmentQuota?: number;
    priceBrl?: number;
};

export class PatientSubscriptionPlan extends AggregateRoot<PatientSubscriptionPlanId> {
    clinicId: ClinicId;
    name: string;
    description: string | null;
    monthlyAppointmentQuota: number;
    priceBrl: number;
    isActive: boolean;

    constructor(props: AllEntityProps<PatientSubscriptionPlan>) {
        super(props);
        this.clinicId = props.clinicId;
        this.name = props.name;
        this.description = props.description ?? null;
        this.monthlyAppointmentQuota = props.monthlyAppointmentQuota;
        this.priceBrl = props.priceBrl;
        this.isActive = props.isActive ?? true;
    }

    static create(props: CreatePatientSubscriptionPlan): PatientSubscriptionPlan {
        const now = new Date();

        return new PatientSubscriptionPlan({
            ...props,
            id: PatientSubscriptionPlanId.generate(),
            description: props.description ?? null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    updateDetails(props: UpdatePatientSubscriptionPlan): void {
        if (props.name !== undefined) {
            this.name = props.name;
        }

        if (props.description !== undefined) {
            this.description = props.description;
        }

        if (props.monthlyAppointmentQuota !== undefined) {
            this.monthlyAppointmentQuota = props.monthlyAppointmentQuota;
        }

        if (props.priceBrl !== undefined) {
            this.priceBrl = props.priceBrl;
        }

        this.update();
    }

    deactivate(): void {
        this.isActive = false;
        this.update();
    }

    toJSON(): EntityJson<PatientSubscriptionPlan> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            name: this.name,
            description: this.description,
            monthlyAppointmentQuota: this.monthlyAppointmentQuota,
            priceBrl: this.priceBrl,
            isActive: this.isActive,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientSubscriptionPlanId extends EntityId<'PatientSubscriptionPlanId'> {
    static from(value: string): PatientSubscriptionPlanId {
        return new PatientSubscriptionPlanId(value);
    }

    static generate(): PatientSubscriptionPlanId {
        return new PatientSubscriptionPlanId();
    }
}
