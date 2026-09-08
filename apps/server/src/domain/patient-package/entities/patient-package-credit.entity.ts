import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientPackageId} from '@domain/patient-package/entities/patient-package-id';

export enum PatientPackageCreditEventType {
    CONSUMPTION = 'CONSUMPTION',
    REFUND = 'REFUND',
    MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
    EXPIRATION = 'EXPIRATION',
}

export type PatientPackageCreditProps = EntityProps<PatientPackageCredit>;
export type CreatePatientPackageCredit = CreateEntity<PatientPackageCredit>;

export class PatientPackageCredit extends AggregateRoot<PatientPackageCreditId> {
    clinicId: ClinicId;
    patientPackageId: PatientPackageId;
    appointmentPaymentId: AppointmentPaymentId | null;
    type: PatientPackageCreditEventType;
    delta: number;
    balanceAfter: number;
    registeredByMemberId: ClinicMemberId | null;
    notes: string | null;

    constructor(props: AllEntityProps<PatientPackageCredit>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientPackageId = props.patientPackageId;
        this.appointmentPaymentId = props.appointmentPaymentId ?? null;
        this.type = props.type;
        this.delta = props.delta;
        this.balanceAfter = props.balanceAfter;
        this.registeredByMemberId = props.registeredByMemberId ?? null;
        this.notes = props.notes ?? null;
    }

    static create(props: CreatePatientPackageCredit): PatientPackageCredit {
        const now = new Date();

        return new PatientPackageCredit({
            ...props,
            id: PatientPackageCreditId.generate(),
            appointmentPaymentId: props.appointmentPaymentId ?? null,
            registeredByMemberId: props.registeredByMemberId ?? null,
            notes: props.notes ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    toJSON(): EntityJson<PatientPackageCredit> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientPackageId: this.patientPackageId.toJSON(),
            appointmentPaymentId: this.appointmentPaymentId?.toJSON() ?? null,
            type: this.type,
            delta: this.delta,
            balanceAfter: this.balanceAfter,
            registeredByMemberId: this.registeredByMemberId?.toJSON() ?? null,
            notes: this.notes,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientPackageCreditId extends EntityId<'PatientPackageCreditId'> {
    static from(value: string): PatientPackageCreditId {
        return new PatientPackageCreditId(value);
    }

    static generate(): PatientPackageCreditId {
        return new PatientPackageCreditId();
    }
}
