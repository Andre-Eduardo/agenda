import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';
import type {PatientId} from '../../patient/entities';
import type {AiAgentProfileId} from './ai-agent-profile.entity';

export enum ChatSessionStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
    ARCHIVED = 'ARCHIVED',
}

export type PatientChatSessionProps = EntityProps<PatientChatSession>;
export type CreatePatientChatSession = CreateEntity<PatientChatSession>;

export class PatientChatSession extends AggregateRoot<PatientChatSessionId> {
    clinicId: ClinicId;
    patientId: PatientId;
    /** Membro dono da sessão (substitui professionalId). */
    memberId: ClinicMemberId;
    agentProfileId: AiAgentProfileId | null;
    title: string | null;
    status: ChatSessionStatus;
    lastActivityAt: Date;

    constructor(props: AllEntityProps<PatientChatSession>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.memberId = props.memberId;
        this.agentProfileId = props.agentProfileId ?? null;
        this.title = props.title ?? null;
        this.status = props.status ?? ChatSessionStatus.ACTIVE;
        this.lastActivityAt = props.lastActivityAt;
    }

    static create(props: CreatePatientChatSession): PatientChatSession {
        const now = new Date();

        return new PatientChatSession({
            ...props,
            id: PatientChatSessionId.generate(),
            clinicId: props.clinicId!,
            patientId: props.patientId!,
            memberId: props.memberId!,
            agentProfileId: props.agentProfileId ?? null,
            title: props.title ?? null,
            status: ChatSessionStatus.ACTIVE,
            lastActivityAt: now,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    /** Atualiza o timestamp de última atividade ao receber uma nova mensagem. */
    touch(): void {
        this.lastActivityAt = new Date();
        this.update();
    }

    close(): void {
        this.status = ChatSessionStatus.CLOSED;
        this.update();
    }

    archive(): void {
        this.status = ChatSessionStatus.ARCHIVED;
        this.update();
    }

    toJSON(): EntityJson<PatientChatSession> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            memberId: this.memberId.toJSON(),
            agentProfileId: this.agentProfileId?.toJSON() ?? null,
            title: this.title,
            status: this.status,
            lastActivityAt: this.lastActivityAt.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientChatSessionId extends EntityId<'PatientChatSessionId'> {
    static from(value: string): PatientChatSessionId {
        return new PatientChatSessionId(value);
    }

    static generate(): PatientChatSessionId {
        return new PatientChatSessionId();
    }
}
