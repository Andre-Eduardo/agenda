import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import type {PatientId} from '../../patient/entities';
import {
    ClinicPatientAccessGrantedEvent,
    ClinicPatientAccessChangedEvent,
    ClinicPatientAccessRevokedEvent,
} from '../events';
import {PatientAccessLevel} from './patient-access-level';

export type ClinicPatientAccessProps = EntityProps<ClinicPatientAccess>;
export type CreateClinicPatientAccess = CreateEntity<ClinicPatientAccess>;
export type UpdateClinicPatientAccess = Partial<ClinicPatientAccessProps>;

/**
 * Acesso de um membro a um paciente dentro da clínica.
 *
 * Resolução de permissão (em ordem):
 *   1. Role no ClinicMember (teto funcional)
 *   2. ClinicPatientAccess (acesso ao paciente)
 *   3. DocumentPermission (override por documento, se existir)
 *
 * OWNER e ADMIN ignoram esse check (acesso total por definição).
 */
export class ClinicPatientAccess extends AggregateRoot<ClinicPatientAccessId> {
    clinicId: ClinicId;
    memberId: ClinicMemberId;
    patientId: PatientId;
    accessLevel: PatientAccessLevel;
    /** Justificativa opcional registrada pelo gestor ao conceder/restringir. */
    reason: string | null;

    constructor(props: AllEntityProps<ClinicPatientAccess>) {
        super(props);
        this.clinicId = props.clinicId;
        this.memberId = props.memberId;
        this.patientId = props.patientId;
        this.accessLevel = props.accessLevel;
        this.reason = props.reason ?? null;
    }

    static create(props: CreateClinicPatientAccess): ClinicPatientAccess {
        const now = new Date();

        const access = new ClinicPatientAccess({
            ...props,
            id: ClinicPatientAccessId.generate(),
            clinicId: props.clinicId,
            memberId: props.memberId,
            patientId: props.patientId,
            accessLevel: props.accessLevel,
            reason: props.reason ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        access.addEvent(new ClinicPatientAccessGrantedEvent({access, timestamp: now}));

        return access;
    }

    change(props: UpdateClinicPatientAccess): void {
        const oldState = new ClinicPatientAccess(this);

        if (props.accessLevel !== undefined) {
            this.accessLevel = props.accessLevel;
        }

        if (props.reason !== undefined) {
            this.reason = props.reason;
        }

        this.addEvent(new ClinicPatientAccessChangedEvent({oldState, newState: this}));
    }

    revoke(): void {
        super.delete();
        this.accessLevel = PatientAccessLevel.NONE;
        this.addEvent(new ClinicPatientAccessRevokedEvent({access: this}));
    }

    canRead(): boolean {
        return this.accessLevel === PatientAccessLevel.FULL || this.accessLevel === PatientAccessLevel.READ_ONLY;
    }

    canWrite(): boolean {
        return this.accessLevel === PatientAccessLevel.FULL;
    }

    canRegister(): boolean {
        return this.accessLevel === PatientAccessLevel.FULL || this.accessLevel === PatientAccessLevel.REGISTER_ONLY;
    }

    toJSON(): EntityJson<ClinicPatientAccess> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            memberId: this.memberId.toJSON(),
            patientId: this.patientId.toJSON(),
            accessLevel: this.accessLevel,
            reason: this.reason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicPatientAccessId extends EntityId<'ClinicPatientAccessId'> {
    static from(value: string): ClinicPatientAccessId {
        return new ClinicPatientAccessId(value);
    }

    static generate(): ClinicPatientAccessId {
        return new ClinicPatientAccessId();
    }
}
