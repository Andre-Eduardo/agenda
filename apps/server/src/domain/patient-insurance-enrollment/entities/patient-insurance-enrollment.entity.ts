import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {PreconditionException} from '@domain/@shared/exceptions';
import type {ClinicId} from '@domain/clinic/entities';
import type {InsurancePlanId} from '@domain/insurance-plan/entities';
import type {PatientId} from '@domain/patient/entities';

export enum PatientInsuranceEnrollmentStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

export type PatientInsuranceEnrollmentProps = EntityProps<PatientInsuranceEnrollment>;
export type CreatePatientInsuranceEnrollment = Omit<
    CreateEntity<PatientInsuranceEnrollment>,
    'status' | 'isPrimary'
> & {
    isPrimary?: boolean;
};
export type UpdatePatientInsuranceEnrollment = {
    cardNumber?: string | null;
    validFrom?: Date | null;
    validUntil?: Date | null;
};

export class PatientInsuranceEnrollment extends AggregateRoot<PatientInsuranceEnrollmentId> {
    clinicId: ClinicId;
    patientId: PatientId;
    insurancePlanId: InsurancePlanId;
    cardNumber: string | null;
    validFrom: Date | null;
    validUntil: Date | null;
    isPrimary: boolean;
    status: PatientInsuranceEnrollmentStatus;

    constructor(props: AllEntityProps<PatientInsuranceEnrollment>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.insurancePlanId = props.insurancePlanId;
        this.cardNumber = props.cardNumber ?? null;
        this.validFrom = props.validFrom ?? null;
        this.validUntil = props.validUntil ?? null;
        this.isPrimary = props.isPrimary ?? false;
        this.status = props.status ?? PatientInsuranceEnrollmentStatus.ACTIVE;
    }

    static create(props: CreatePatientInsuranceEnrollment): PatientInsuranceEnrollment {
        const now = new Date();

        return new PatientInsuranceEnrollment({
            ...props,
            id: PatientInsuranceEnrollmentId.generate(),
            cardNumber: props.cardNumber ?? null,
            validFrom: props.validFrom ?? null,
            validUntil: props.validUntil ?? null,
            isPrimary: props.isPrimary ?? false,
            status: PatientInsuranceEnrollmentStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    updateDetails(props: UpdatePatientInsuranceEnrollment): void {
        if (props.cardNumber !== undefined) {
            this.cardNumber = props.cardNumber;
        }

        if (props.validFrom !== undefined) {
            this.validFrom = props.validFrom;
        }

        if (props.validUntil !== undefined) {
            this.validUntil = props.validUntil;
        }

        this.update();
    }

    markAsPrimary(): void {
        this.isPrimary = true;
        this.update();
    }

    unmarkAsPrimary(): void {
        this.isPrimary = false;
        this.update();
    }

    cancel(): void {
        if (this.status === PatientInsuranceEnrollmentStatus.CANCELLED) {
            throw new PreconditionException('patient_insurance_enrollment.already_cancelled');
        }

        this.status = PatientInsuranceEnrollmentStatus.CANCELLED;
        this.isPrimary = false;
        this.update();
    }

    expire(): void {
        if (this.status !== PatientInsuranceEnrollmentStatus.ACTIVE) {
            return;
        }

        this.status = PatientInsuranceEnrollmentStatus.EXPIRED;
        this.isPrimary = false;
        this.update();
    }

    assertCanCoverAppointment(on: Date): void {
        if (this.status !== PatientInsuranceEnrollmentStatus.ACTIVE) {
            throw new PreconditionException('patient_insurance_enrollment.not_active');
        }

        if ((this.validFrom !== null && this.validFrom > on) || (this.validUntil !== null && this.validUntil < on)) {
            throw new PreconditionException('patient_insurance_enrollment.not_valid_on_appointment_date');
        }
    }

    toJSON(): EntityJson<PatientInsuranceEnrollment> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            insurancePlanId: this.insurancePlanId.toJSON(),
            cardNumber: this.cardNumber,
            validFrom: this.validFrom?.toJSON() ?? null,
            validUntil: this.validUntil?.toJSON() ?? null,
            isPrimary: this.isPrimary,
            status: this.status,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientInsuranceEnrollmentId extends EntityId<'PatientInsuranceEnrollmentId'> {
    static from(value: string): PatientInsuranceEnrollmentId {
        return new PatientInsuranceEnrollmentId(value);
    }

    static generate(): PatientInsuranceEnrollmentId {
        return new PatientInsuranceEnrollmentId();
    }
}
