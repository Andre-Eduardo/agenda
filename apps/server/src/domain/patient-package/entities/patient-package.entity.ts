import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {PreconditionException} from '@domain/@shared/exceptions';
import type {PaymentMethod} from '@domain/appointment-payment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PackagePlanId} from '@domain/package-plan/entities';
import {PatientPackageId} from '@domain/patient-package/entities/patient-package-id';
import type {PatientId} from '@domain/patient/entities';

export enum PatientPackageStatus {
    ACTIVE = 'ACTIVE',
    DEPLETED = 'DEPLETED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export type PatientPackageProps = EntityProps<PatientPackage>;
export type CreatePatientPackage = Omit<CreateEntity<PatientPackage>, 'status' | 'remainingCredits' | 'paidAt'> & {
    paidAt?: Date | null;
};

export class PatientPackage extends AggregateRoot<PatientPackageId> {
    clinicId: ClinicId;
    patientId: PatientId;
    packagePlanId: PackagePlanId;
    planNameSnapshot: string;
    totalCredits: number;
    priceBrl: number;
    remainingCredits: number;
    status: PatientPackageStatus;
    purchasedAt: Date;
    expiresAt: Date | null;
    paymentMethod: PaymentMethod;
    paidAt: Date | null;
    soldByMemberId: ClinicMemberId;

    constructor(props: AllEntityProps<PatientPackage>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.packagePlanId = props.packagePlanId;
        this.planNameSnapshot = props.planNameSnapshot;
        this.totalCredits = props.totalCredits;
        this.priceBrl = props.priceBrl;
        this.remainingCredits = props.remainingCredits;
        this.status = props.status;
        this.purchasedAt = props.purchasedAt;
        this.expiresAt = props.expiresAt ?? null;
        this.paymentMethod = props.paymentMethod;
        this.paidAt = props.paidAt ?? null;
        this.soldByMemberId = props.soldByMemberId;
    }

    static create(props: CreatePatientPackage): PatientPackage {
        const now = new Date();

        return new PatientPackage({
            ...props,
            id: PatientPackageId.generate(),
            remainingCredits: props.totalCredits,
            status: PatientPackageStatus.ACTIVE,
            paidAt: props.paidAt ?? null,
            expiresAt: props.expiresAt ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    /** In-memory guard mirror of the atomic DB decrement — see PatientPackageRepository.consumeCredit(). */
    assertCanConsumeCredit(): void {
        if (this.status !== PatientPackageStatus.ACTIVE) {
            throw new PreconditionException('patient_package.cannot_consume');
        }

        if (this.remainingCredits <= 0) {
            throw new PreconditionException('patient_package.no_credits_left');
        }
    }

    /** Reflects, in memory, a credit consumption already applied atomically at the DB level. */
    applyConsumedCredit(newRemainingCredits: number): void {
        this.remainingCredits = newRemainingCredits;
        this.status = newRemainingCredits <= 0 ? PatientPackageStatus.DEPLETED : this.status;
        this.update();
    }

    /** Reflects, in memory, a credit refund already applied atomically at the DB level. */
    applyRefundedCredit(newRemainingCredits: number): void {
        this.remainingCredits = newRemainingCredits;

        if (this.status === PatientPackageStatus.DEPLETED && newRemainingCredits > 0) {
            this.status = PatientPackageStatus.ACTIVE;
        }

        this.update();
    }

    cancel(): void {
        if (this.status === PatientPackageStatus.CANCELLED) {
            throw new PreconditionException('patient_package.already_cancelled');
        }

        this.status = PatientPackageStatus.CANCELLED;
        this.update();
    }

    expire(): void {
        if (this.status !== PatientPackageStatus.ACTIVE) {
            return;
        }

        this.status = PatientPackageStatus.EXPIRED;
        this.update();
    }

    toJSON(): EntityJson<PatientPackage> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            packagePlanId: this.packagePlanId.toJSON(),
            planNameSnapshot: this.planNameSnapshot,
            totalCredits: this.totalCredits,
            priceBrl: this.priceBrl,
            remainingCredits: this.remainingCredits,
            status: this.status,
            purchasedAt: this.purchasedAt.toJSON(),
            expiresAt: this.expiresAt?.toJSON() ?? null,
            paymentMethod: this.paymentMethod,
            paidAt: this.paidAt?.toJSON() ?? null,
            soldByMemberId: this.soldByMemberId.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}
