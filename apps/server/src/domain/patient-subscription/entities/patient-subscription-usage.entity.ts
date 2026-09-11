import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientSubscriptionId} from '@domain/patient-subscription/entities/patient-subscription-id';

export type PatientSubscriptionUsageProps = EntityProps<PatientSubscriptionUsage>;
export type CreatePatientSubscriptionUsage = Omit<CreateEntity<PatientSubscriptionUsage>, 'appointmentsUsed'>;

export class PatientSubscriptionUsage extends AggregateRoot<PatientSubscriptionUsageId> {
    clinicId: ClinicId;
    patientSubscriptionId: PatientSubscriptionId;
    periodYear: number;
    periodMonth: number;
    appointmentsUsed: number;
    quotaSnapshot: number;

    constructor(props: AllEntityProps<PatientSubscriptionUsage>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientSubscriptionId = props.patientSubscriptionId;
        this.periodYear = props.periodYear;
        this.periodMonth = props.periodMonth;
        this.appointmentsUsed = props.appointmentsUsed ?? 0;
        this.quotaSnapshot = props.quotaSnapshot;
    }

    static create(props: CreatePatientSubscriptionUsage): PatientSubscriptionUsage {
        const now = new Date();

        return new PatientSubscriptionUsage({
            ...props,
            id: PatientSubscriptionUsageId.generate(),
            appointmentsUsed: 0,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    toJSON(): EntityJson<PatientSubscriptionUsage> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientSubscriptionId: this.patientSubscriptionId.toJSON(),
            periodYear: this.periodYear,
            periodMonth: this.periodMonth,
            appointmentsUsed: this.appointmentsUsed,
            quotaSnapshot: this.quotaSnapshot,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientSubscriptionUsageId extends EntityId<'PatientSubscriptionUsageId'> {
    static from(value: string): PatientSubscriptionUsageId {
        return new PatientSubscriptionUsageId(value);
    }

    static generate(): PatientSubscriptionUsageId {
        return new PatientSubscriptionUsageId();
    }
}
