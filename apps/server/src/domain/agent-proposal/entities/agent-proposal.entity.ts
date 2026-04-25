import {AggregateRoot, type AllEntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {PreconditionException} from '../../@shared/exceptions';
import type {ProfessionalId} from '../../professional/entities';

export enum AgentProposalType {
    APPOINTMENT = 'APPOINTMENT',
    APPOINTMENT_CANCEL = 'APPOINTMENT_CANCEL',
    APPOINTMENT_RESCHEDULE = 'APPOINTMENT_RESCHEDULE',
    PATIENT_ALERT = 'PATIENT_ALERT',
}

export enum AgentProposalStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
}

export type AgentProposalProps = {
    id: AgentProposalId;
    sessionId: string | null;
    messageId: string | null;
    patientId: string | null;
    professionalId: ProfessionalId;
    type: AgentProposalType;
    status: AgentProposalStatus;
    payload: Record<string, unknown>;
    preview: Record<string, unknown>;
    rationale: string | null;
    confidence: number | null;
    resultEntityId: string | null;
    expiresAt: Date | null;
    confirmedAt: Date | null;
    confirmedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateAgentProposal = Omit<
    CreateEntity<AgentProposal>,
    'status' | 'confirmedAt' | 'confirmedBy' | 'rejectedAt' | 'rejectionReason' | 'resultEntityId'
>;

export class AgentProposal extends AggregateRoot<AgentProposalId> {
    sessionId: string | null;
    messageId: string | null;
    patientId: string | null;
    professionalId: ProfessionalId;
    type: AgentProposalType;
    status: AgentProposalStatus;
    payload: Record<string, unknown>;
    preview: Record<string, unknown>;
    rationale: string | null;
    confidence: number | null;
    resultEntityId: string | null;
    expiresAt: Date | null;
    confirmedAt: Date | null;
    confirmedBy: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;

    constructor(props: AllEntityProps<AgentProposal>) {
        super(props);
        this.sessionId = props.sessionId ?? null;
        this.messageId = props.messageId ?? null;
        this.patientId = props.patientId ?? null;
        this.professionalId = props.professionalId;
        this.type = props.type;
        this.status = props.status ?? AgentProposalStatus.PENDING;
        this.payload = props.payload;
        this.preview = props.preview;
        this.rationale = props.rationale ?? null;
        this.confidence = props.confidence ?? null;
        this.resultEntityId = props.resultEntityId ?? null;
        this.expiresAt = props.expiresAt ?? null;
        this.confirmedAt = props.confirmedAt ?? null;
        this.confirmedBy = props.confirmedBy ?? null;
        this.rejectedAt = props.rejectedAt ?? null;
        this.rejectionReason = props.rejectionReason ?? null;
    }

    static create(props: CreateAgentProposal): AgentProposal {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h TTL

        return new AgentProposal({
            ...props,
            id: AgentProposalId.generate(),
            patientId: props.patientId ?? null,
            sessionId: props.sessionId ?? null,
            messageId: props.messageId ?? null,
            rationale: props.rationale ?? null,
            confidence: props.confidence ?? null,
            status: AgentProposalStatus.PENDING,
            resultEntityId: null,
            confirmedAt: null,
            confirmedBy: null,
            rejectedAt: null,
            rejectionReason: null,
            expiresAt: props.expiresAt ?? expiresAt,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    isConfirmable(): boolean {
        if (this.status !== AgentProposalStatus.PENDING) {
            return false;
        }
        if (this.expiresAt !== null && this.expiresAt < new Date()) {
            return false;
        }
        return true;
    }

    confirm(confirmedBy: string, resultEntityId?: string): void {
        if (!this.isConfirmable()) {
            throw new PreconditionException(
                `Proposal cannot be confirmed: status=${this.status}${this.expiresAt && this.expiresAt < new Date() ? ', expired' : ''}`,
            );
        }
        const now = new Date();
        this.status = AgentProposalStatus.CONFIRMED;
        this.confirmedAt = now;
        this.confirmedBy = confirmedBy;
        this.resultEntityId = resultEntityId ?? null;
        this.updatedAt = now;
    }

    reject(reason?: string): void {
        if (this.status !== AgentProposalStatus.PENDING) {
            throw new PreconditionException(`Proposal cannot be rejected: status=${this.status}`);
        }
        const now = new Date();
        this.status = AgentProposalStatus.REJECTED;
        this.rejectedAt = now;
        this.rejectionReason = reason ?? null;
        this.updatedAt = now;
    }

    expire(): void {
        if (this.status !== AgentProposalStatus.PENDING) {
            return;
        }
        const now = new Date();
        this.status = AgentProposalStatus.EXPIRED;
        this.updatedAt = now;
    }

    toJSON() {
        return {
            id: this.id.toJSON(),
            sessionId: this.sessionId,
            messageId: this.messageId,
            patientId: this.patientId,
            professionalId: this.professionalId.toJSON(),
            type: this.type,
            status: this.status,
            payload: this.payload,
            preview: this.preview,
            rationale: this.rationale,
            confidence: this.confidence,
            resultEntityId: this.resultEntityId,
            expiresAt: this.expiresAt?.toJSON() ?? null,
            confirmedAt: this.confirmedAt?.toJSON() ?? null,
            confirmedBy: this.confirmedBy,
            rejectedAt: this.rejectedAt?.toJSON() ?? null,
            rejectionReason: this.rejectionReason,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class AgentProposalId extends EntityId<'AgentProposalId'> {
    static from(value: string): AgentProposalId {
        return new AgentProposalId(value);
    }

    static generate(): AgentProposalId {
        return new AgentProposalId();
    }
}
