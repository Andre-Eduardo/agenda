import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import {
    ProfessionalAgendaAccessGrantedEvent,
    ProfessionalAgendaAccessRevokedEvent,
} from '@domain/professional-agenda-access/events';

export type ProfessionalAgendaAccessProps = EntityProps<ProfessionalAgendaAccess>;
export type CreateProfessionalAgendaAccess = CreateEntity<ProfessionalAgendaAccess>;

/**
 * Concede a um membro (ex: secretária) acesso para gerenciar a agenda
 * (expediente e bloqueios) de um profissional específico.
 *
 * Resolução de permissão (em ordem), espelha ClinicPatientAccess:
 *   1. Role no ClinicMember (teto funcional) — OWNER e ADMIN ignoram este check.
 *   2. Auto-acesso: o próprio profissional sempre gerencia a própria agenda.
 *   3. ProfessionalAgendaAccess — concessão explícita para outros membros.
 */
export class ProfessionalAgendaAccess extends AggregateRoot<ProfessionalAgendaAccessId> {
    clinicId: ClinicId;
    granteeMemberId: ClinicMemberId;
    professionalMemberId: ClinicMemberId;
    /** Justificativa opcional registrada ao conceder o acesso. */
    reason: string | null;

    constructor(props: AllEntityProps<ProfessionalAgendaAccess>) {
        super(props);
        this.clinicId = props.clinicId;
        this.granteeMemberId = props.granteeMemberId;
        this.professionalMemberId = props.professionalMemberId;
        this.reason = props.reason ?? null;
    }

    static create(props: CreateProfessionalAgendaAccess): ProfessionalAgendaAccess {
        const now = new Date();

        const access = new ProfessionalAgendaAccess({
            ...props,
            id: ProfessionalAgendaAccessId.generate(),
            clinicId: props.clinicId,
            granteeMemberId: props.granteeMemberId,
            professionalMemberId: props.professionalMemberId,
            reason: props.reason ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        access.addEvent(new ProfessionalAgendaAccessGrantedEvent({access, timestamp: now}));

        return access;
    }

    revoke(): void {
        super.delete();
        this.addEvent(new ProfessionalAgendaAccessRevokedEvent({access: this}));
    }

    updateReason(reason: string | null): void {
        this.reason = reason;
        this.update();
    }

    toJSON(): EntityJson<ProfessionalAgendaAccess> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            granteeMemberId: this.granteeMemberId.toJSON(),
            professionalMemberId: this.professionalMemberId.toJSON(),
            reason: this.reason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ProfessionalAgendaAccessId extends EntityId<'ProfessionalAgendaAccessId'> {
    static from(value: string): ProfessionalAgendaAccessId {
        return new ProfessionalAgendaAccessId(value);
    }

    static generate(): ProfessionalAgendaAccessId {
        return new ProfessionalAgendaAccessId();
    }
}
