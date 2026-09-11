import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {PreconditionException} from '@domain/@shared/exceptions';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';
import {PatientSubscriptionId} from '@domain/patient-subscription/entities/patient-subscription-id';
import type {PatientId} from '@domain/patient/entities';

export enum PatientSubscriptionStatus {
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

export type PatientSubscriptionProps = EntityProps<PatientSubscription>;
export type CreatePatientSubscription = Omit<
    CreateEntity<PatientSubscription>,
    'status' | 'cancelledAt' | 'cancelReason'
>;

export class PatientSubscription extends AggregateRoot<PatientSubscriptionId> {
    clinicId: ClinicId;
    patientId: PatientId;
    subscriptionPlanId: PatientSubscriptionPlanId;
    planNameSnapshot: string;
    monthlyQuotaSnapshot: number;
    priceBrlSnapshot: number;
    status: PatientSubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelledAt: Date | null;
    cancelReason: string | null;

    constructor(props: AllEntityProps<PatientSubscription>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.subscriptionPlanId = props.subscriptionPlanId;
        this.planNameSnapshot = props.planNameSnapshot;
        this.monthlyQuotaSnapshot = props.monthlyQuotaSnapshot;
        this.priceBrlSnapshot = props.priceBrlSnapshot;
        this.status = props.status;
        this.currentPeriodStart = props.currentPeriodStart;
        this.currentPeriodEnd = props.currentPeriodEnd;
        this.cancelledAt = props.cancelledAt ?? null;
        this.cancelReason = props.cancelReason ?? null;
    }

    static create(props: CreatePatientSubscription): PatientSubscription {
        const now = new Date();

        return new PatientSubscription({
            ...props,
            id: PatientSubscriptionId.generate(),
            status: PatientSubscriptionStatus.ACTIVE,
            cancelledAt: null,
            cancelReason: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    cancel(reason: string): void {
        if (this.status === PatientSubscriptionStatus.CANCELLED) {
            throw new PreconditionException('patient_subscription.already_cancelled');
        }

        this.status = PatientSubscriptionStatus.CANCELLED;
        this.cancelledAt = new Date();
        this.cancelReason = reason;
        this.update();
    }

    /** Rolls the subscription into its next billing period. Only called by the monthly renewal job. */
    renewPeriod(nextPeriodStart: Date, nextPeriodEnd: Date): void {
        if (this.status !== PatientSubscriptionStatus.ACTIVE) {
            throw new PreconditionException('patient_subscription.cannot_renew');
        }

        this.currentPeriodStart = nextPeriodStart;
        this.currentPeriodEnd = nextPeriodEnd;
        this.update();
    }

    toJSON(): EntityJson<PatientSubscription> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            subscriptionPlanId: this.subscriptionPlanId.toJSON(),
            planNameSnapshot: this.planNameSnapshot,
            monthlyQuotaSnapshot: this.monthlyQuotaSnapshot,
            priceBrlSnapshot: this.priceBrlSnapshot,
            status: this.status,
            currentPeriodStart: this.currentPeriodStart.toJSON(),
            currentPeriodEnd: this.currentPeriodEnd.toJSON(),
            cancelledAt: this.cancelledAt?.toJSON() ?? null,
            cancelReason: this.cancelReason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}
