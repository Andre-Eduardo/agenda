import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {PreconditionException} from '@domain/@shared/exceptions';
import type {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {InsurancePlanId} from '@domain/insurance-plan/entities';
import type {PatientInsuranceEnrollmentId} from '@domain/patient-insurance-enrollment/entities';

export enum InsuranceAuthorizationStatus {
    NOT_REQUIRED = 'NOT_REQUIRED',
    PENDING = 'PENDING',
    AUTHORIZED = 'AUTHORIZED',
    DENIED = 'DENIED',
}

export enum InsuranceClaimStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    PAID = 'PAID',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    DENIED = 'DENIED',
    APPEALED = 'APPEALED',
    CANCELLED = 'CANCELLED',
}

export type InsuranceClaimProps = EntityProps<InsuranceClaim>;
export type CreateInsuranceClaim = Omit<
    CreateEntity<InsuranceClaim>,
    'authorizationStatus' | 'claimStatus' | 'approvedAmountBrl' | 'glosaReason' | 'glosaAmountBrl' | 'submittedAt' | 'resolvedAt'
>;

export class InsuranceClaim extends AggregateRoot<InsuranceClaimId> {
    clinicId: ClinicId;
    appointmentPaymentId: AppointmentPaymentId;
    patientInsuranceEnrollmentId: PatientInsuranceEnrollmentId;
    insurancePlanId: InsurancePlanId;
    authorizationCode: string | null;
    authorizationStatus: InsuranceAuthorizationStatus;
    claimStatus: InsuranceClaimStatus;
    submittedAmountBrl: number;
    approvedAmountBrl: number | null;
    glosaReason: string | null;
    glosaAmountBrl: number | null;
    submittedAt: Date | null;
    resolvedAt: Date | null;

    constructor(props: AllEntityProps<InsuranceClaim>) {
        super(props);
        this.clinicId = props.clinicId;
        this.appointmentPaymentId = props.appointmentPaymentId;
        this.patientInsuranceEnrollmentId = props.patientInsuranceEnrollmentId;
        this.insurancePlanId = props.insurancePlanId;
        this.authorizationCode = props.authorizationCode ?? null;
        this.authorizationStatus = props.authorizationStatus;
        this.claimStatus = props.claimStatus;
        this.submittedAmountBrl = props.submittedAmountBrl;
        this.approvedAmountBrl = props.approvedAmountBrl ?? null;
        this.glosaReason = props.glosaReason ?? null;
        this.glosaAmountBrl = props.glosaAmountBrl ?? null;
        this.submittedAt = props.submittedAt ?? null;
        this.resolvedAt = props.resolvedAt ?? null;
    }

    static create(props: CreateInsuranceClaim): InsuranceClaim {
        const now = new Date();
        const hasAuthCode = props.authorizationCode !== null && props.authorizationCode !== undefined;

        return new InsuranceClaim({
            ...props,
            id: InsuranceClaimId.generate(),
            authorizationCode: props.authorizationCode ?? null,
            authorizationStatus: hasAuthCode ? InsuranceAuthorizationStatus.AUTHORIZED : InsuranceAuthorizationStatus.NOT_REQUIRED,
            claimStatus: InsuranceClaimStatus.DRAFT,
            approvedAmountBrl: null,
            glosaReason: null,
            glosaAmountBrl: null,
            submittedAt: null,
            resolvedAt: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    authorize(code: string): void {
        this.authorizationCode = code;
        this.authorizationStatus = InsuranceAuthorizationStatus.AUTHORIZED;
        this.update();
    }

    denyAuthorization(): void {
        this.authorizationStatus = InsuranceAuthorizationStatus.DENIED;
        this.update();
    }

    submit(): void {
        if (this.claimStatus !== InsuranceClaimStatus.DRAFT) {
            throw new PreconditionException('insurance_claim.cannot_submit');
        }

        this.claimStatus = InsuranceClaimStatus.SUBMITTED;
        this.submittedAt = new Date();
        this.update();
    }

    markPaid(approvedAmountBrl: number): void {
        if (this.claimStatus !== InsuranceClaimStatus.SUBMITTED && this.claimStatus !== InsuranceClaimStatus.APPEALED) {
            throw new PreconditionException('insurance_claim.cannot_mark_paid');
        }

        this.claimStatus = InsuranceClaimStatus.PAID;
        this.approvedAmountBrl = approvedAmountBrl;
        this.resolvedAt = new Date();
        this.update();
    }

    registerGlosa(reason: string, glosaAmountBrl: number, approvedAmountBrl: number): void {
        if (this.claimStatus !== InsuranceClaimStatus.SUBMITTED && this.claimStatus !== InsuranceClaimStatus.APPEALED) {
            throw new PreconditionException('insurance_claim.cannot_register_glosa');
        }

        this.glosaReason = reason;
        this.glosaAmountBrl = glosaAmountBrl;
        this.approvedAmountBrl = approvedAmountBrl;
        this.claimStatus = approvedAmountBrl > 0 ? InsuranceClaimStatus.PARTIALLY_PAID : InsuranceClaimStatus.DENIED;
        this.resolvedAt = new Date();
        this.update();
    }

    appeal(): void {
        if (this.claimStatus !== InsuranceClaimStatus.DENIED && this.claimStatus !== InsuranceClaimStatus.PARTIALLY_PAID) {
            throw new PreconditionException('insurance_claim.cannot_appeal');
        }

        this.claimStatus = InsuranceClaimStatus.APPEALED;
        this.resolvedAt = null;
        this.update();
    }

    cancel(): void {
        if (this.claimStatus === InsuranceClaimStatus.PAID) {
            throw new PreconditionException('insurance_claim.cannot_cancel');
        }

        this.claimStatus = InsuranceClaimStatus.CANCELLED;
        this.update();
    }

    toJSON(): EntityJson<InsuranceClaim> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            appointmentPaymentId: this.appointmentPaymentId.toJSON(),
            patientInsuranceEnrollmentId: this.patientInsuranceEnrollmentId.toJSON(),
            insurancePlanId: this.insurancePlanId.toJSON(),
            authorizationCode: this.authorizationCode,
            authorizationStatus: this.authorizationStatus,
            claimStatus: this.claimStatus,
            submittedAmountBrl: this.submittedAmountBrl,
            approvedAmountBrl: this.approvedAmountBrl,
            glosaReason: this.glosaReason,
            glosaAmountBrl: this.glosaAmountBrl,
            submittedAt: this.submittedAt?.toJSON() ?? null,
            resolvedAt: this.resolvedAt?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class InsuranceClaimId extends EntityId<'InsuranceClaimId'> {
    static from(value: string): InsuranceClaimId {
        return new InsuranceClaimId(value);
    }

    static generate(): InsuranceClaimId {
        return new InsuranceClaimId();
    }
}
