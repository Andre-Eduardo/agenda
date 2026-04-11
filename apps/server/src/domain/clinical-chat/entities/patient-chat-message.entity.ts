import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {PatientChatSessionId} from './patient-chat-session.entity';

export enum ChatMessageRole {
    USER = 'USER',
    ASSISTANT = 'ASSISTANT',
    SYSTEM = 'SYSTEM',
    /** Mensagem interna de pipeline (ex: contexto injetado, trace). Não exibida ao usuário. */
    INTERNAL = 'INTERNAL',
}

export type MessageMetadata = Record<string, unknown>;

export type PatientChatMessageProps = EntityProps<PatientChatMessage>;
export type CreatePatientChatMessage = CreateEntity<PatientChatMessage>;

export class PatientChatMessage extends AggregateRoot<PatientChatMessageId> {
    sessionId: PatientChatSessionId;
    role: ChatMessageRole;
    content: string;
    /** Metadados opcionais: modelo utilizado, latência, flags de confiança, etc. */
    metadata: MessageMetadata | null;
    /**
     * IDs dos PatientContextChunks usados como contexto para gerar esta mensagem.
     * Rastreabilidade do RAG: permite saber quais chunks embasaram cada resposta.
     */
    chunkIds: string[];

    constructor(props: AllEntityProps<PatientChatMessage>) {
        super(props);
        this.sessionId = props.sessionId;
        this.role = props.role;
        this.content = props.content;
        this.metadata = props.metadata ?? null;
        this.chunkIds = props.chunkIds ?? [];
    }

    static create(props: CreatePatientChatMessage): PatientChatMessage {
        const now = new Date();

        return new PatientChatMessage({
            ...props,
            id: PatientChatMessageId.generate(),
            sessionId: props.sessionId!,
            role: props.role!,
            content: props.content!,
            metadata: props.metadata ?? null,
            chunkIds: props.chunkIds ?? [],
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    toJSON(): EntityJson<PatientChatMessage> {
        return {
            id: this.id.toJSON(),
            sessionId: this.sessionId.toJSON(),
            role: this.role,
            content: this.content,
            metadata: this.metadata,
            chunkIds: this.chunkIds,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

export class PatientChatMessageId extends EntityId<'PatientChatMessageId'> {
    static from(value: string): PatientChatMessageId {
        return new PatientChatMessageId(value);
    }

    static generate(): PatientChatMessageId {
        return new PatientChatMessageId();
    }
}
