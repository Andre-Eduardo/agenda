import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {AppointmentType} from '@domain/appointment/entities';
import type {ClinicId} from '@domain/clinic/entities';

export type PackagePlanProps = EntityProps<PackagePlan>;
export type CreatePackagePlan = Omit<CreateEntity<PackagePlan>, 'isActive'>;
export type UpdatePackagePlan = {
    name?: string;
    description?: string | null;
    totalCredits?: number;
    priceBrl?: number;
    validityDays?: number | null;
    appointmentType?: AppointmentType | null;
};

export class PackagePlan extends AggregateRoot<PackagePlanId> {
    clinicId: ClinicId;
    name: string;
    description: string | null;
    totalCredits: number;
    priceBrl: number;
    validityDays: number | null;
    appointmentType: AppointmentType | null;
    isActive: boolean;

    constructor(props: AllEntityProps<PackagePlan>) {
        super(props);
        this.clinicId = props.clinicId;
        this.name = props.name;
        this.description = props.description ?? null;
        this.totalCredits = props.totalCredits;
        this.priceBrl = props.priceBrl;
        this.validityDays = props.validityDays ?? null;
        this.appointmentType = props.appointmentType ?? null;
        this.isActive = props.isActive ?? true;
    }

    static create(props: CreatePackagePlan): PackagePlan {
        const now = new Date();

        return new PackagePlan({
            ...props,
            id: PackagePlanId.generate(),
            description: props.description ?? null,
            validityDays: props.validityDays ?? null,
            appointmentType: props.appointmentType ?? null,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    updateDetails(props: UpdatePackagePlan): void {
        if (props.name !== undefined) {
            this.name = props.name;
        }

        if (props.description !== undefined) {
            this.description = props.description;
        }

        if (props.totalCredits !== undefined) {
            this.totalCredits = props.totalCredits;
        }

        if (props.priceBrl !== undefined) {
            this.priceBrl = props.priceBrl;
        }

        if (props.validityDays !== undefined) {
            this.validityDays = props.validityDays;
        }

        if (props.appointmentType !== undefined) {
            this.appointmentType = props.appointmentType;
        }

        this.update();
    }

    deactivate(): void {
        this.isActive = false;
        this.update();
    }

    toJSON(): EntityJson<PackagePlan> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            name: this.name,
            description: this.description,
            totalCredits: this.totalCredits,
            priceBrl: this.priceBrl,
            validityDays: this.validityDays,
            appointmentType: this.appointmentType,
            isActive: this.isActive,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PackagePlanId extends EntityId<'PackagePlanId'> {
    static from(value: string): PackagePlanId {
        return new PackagePlanId(value);
    }

    static generate(): PackagePlanId {
        return new PackagePlanId();
    }
}
