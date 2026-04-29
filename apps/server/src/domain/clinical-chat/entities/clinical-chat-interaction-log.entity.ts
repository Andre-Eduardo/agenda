import {
  AggregateRoot,
  type AllEntityProps,
  type EntityJson,
  type EntityProps,
  type CreateEntity,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicId } from "@domain/clinic/entities";
import type { PatientChatSessionId } from "@domain/clinical-chat/entities/patient-chat-session.entity";
import type { AiAgentProfileId } from "@domain/clinical-chat/entities/ai-agent-profile.entity";
import type { PatientContextSnapshotId } from "@domain/clinical-chat/entities/patient-context-snapshot.entity";

export enum ChatInteractionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  /** Resposta gerada por fallback (ex: provider indisponível, mock ativado) */
  FALLBACK = "FALLBACK",
}

export type ClinicalChatInteractionLogProps = EntityProps<ClinicalChatInteractionLog>;
export type CreateClinicalChatInteractionLog = CreateEntity<ClinicalChatInteractionLog>;

/**
 * Log de auditoria de uma interação de chat clínico com IA.
 *
 * Separação intencional entre:
 * - `PatientChatMessage`: a mensagem em si (conteúdo, papel, rastreabilidade de chunks)
 * - `ClinicalChatInteractionLog`: metadados de execução (provider, tokens, latência, status)
 *
 * Permite auditoria completa sem poluir a entidade de mensagem com dados técnicos.
 */
export class ClinicalChatInteractionLog extends AggregateRoot<ClinicalChatInteractionLogId> {
  clinicId: ClinicId;
  sessionId: PatientChatSessionId;
  /** ID da PatientChatMessage do usuário que originou esta interação */
  userMessageId: string;
  /** ID da PatientChatMessage do assistente gerada (null se falhou antes de gerar) */
  assistantMessageId: string | null;

  // Provider & Model
  providerId: string | null;
  modelId: string | null;
  agentProfileId: AiAgentProfileId | null;
  agentSlug: string | null;

  // Rastreabilidade de contexto
  snapshotId: PatientContextSnapshotId | null;
  /** Hash do snapshot no momento da interação */
  snapshotVersion: string | null;
  /** IDs dos chunks recuperados via RAG */
  retrievedChunkIds: string[];

  // Uso de tokens
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;

  // Performance
  latencyMs: number | null;

  // Status & erros
  status: ChatInteractionStatus;
  errorCode: string | null;
  errorMessage: string | null;

  // Flags
  usedFallback: boolean;

  // Agent observability
  toolNames: string[];
  proposalIds: string[];
  totalIterations: number | null;
  ragChunksUsed: number | null;
  avgTopKScore: number | null;
  totalDurationMs: number | null;

  constructor(props: AllEntityProps<ClinicalChatInteractionLog>) {
    super(props);
    this.clinicId = props.clinicId;
    this.sessionId = props.sessionId;
    this.userMessageId = props.userMessageId;
    this.assistantMessageId = props.assistantMessageId ?? null;
    this.providerId = props.providerId ?? null;
    this.modelId = props.modelId ?? null;
    this.agentProfileId = props.agentProfileId ?? null;
    this.agentSlug = props.agentSlug ?? null;
    this.snapshotId = props.snapshotId ?? null;
    this.snapshotVersion = props.snapshotVersion ?? null;
    this.retrievedChunkIds = props.retrievedChunkIds ?? [];
    this.promptTokens = props.promptTokens ?? null;
    this.completionTokens = props.completionTokens ?? null;
    this.totalTokens = props.totalTokens ?? null;
    this.costUsd = props.costUsd ?? null;
    this.latencyMs = props.latencyMs ?? null;
    this.status = props.status ?? ChatInteractionStatus.PENDING;
    this.errorCode = props.errorCode ?? null;
    this.errorMessage = props.errorMessage ?? null;
    this.usedFallback = props.usedFallback ?? false;
    this.toolNames = props.toolNames ?? [];
    this.proposalIds = props.proposalIds ?? [];
    this.totalIterations = props.totalIterations ?? null;
    this.ragChunksUsed = props.ragChunksUsed ?? null;
    this.avgTopKScore = props.avgTopKScore ?? null;
    this.totalDurationMs = props.totalDurationMs ?? null;
  }

  static create(props: CreateClinicalChatInteractionLog): ClinicalChatInteractionLog {
    const now = new Date();

    return new ClinicalChatInteractionLog({
      ...props,
      id: ClinicalChatInteractionLogId.generate(),
      clinicId: props.clinicId,
      sessionId: props.sessionId,
      userMessageId: props.userMessageId,
      assistantMessageId: props.assistantMessageId ?? null,
      providerId: props.providerId ?? null,
      modelId: props.modelId ?? null,
      agentProfileId: props.agentProfileId ?? null,
      agentSlug: props.agentSlug ?? null,
      snapshotId: props.snapshotId ?? null,
      snapshotVersion: props.snapshotVersion ?? null,
      retrievedChunkIds: props.retrievedChunkIds ?? [],
      promptTokens: props.promptTokens ?? null,
      completionTokens: props.completionTokens ?? null,
      totalTokens: props.totalTokens ?? null,
      costUsd: props.costUsd ?? null,
      latencyMs: props.latencyMs ?? null,
      status: props.status ?? ChatInteractionStatus.PENDING,
      errorCode: props.errorCode ?? null,
      errorMessage: props.errorMessage ?? null,
      usedFallback: props.usedFallback ?? false,
      toolNames: props.toolNames ?? [],
      proposalIds: props.proposalIds ?? [],
      totalIterations: props.totalIterations ?? null,
      ragChunksUsed: props.ragChunksUsed ?? null,
      avgTopKScore: props.avgTopKScore ?? null,
      totalDurationMs: props.totalDurationMs ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  complete(params: {
    assistantMessageId: string;
    providerId: string;
    modelId: string;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    latencyMs: number;
    usedFallback?: boolean;
    toolNames?: string[];
    proposalIds?: string[];
    totalIterations?: number;
    ragChunksUsed?: number;
    avgTopKScore?: number;
    totalDurationMs?: number;
  }): void {
    this.assistantMessageId = params.assistantMessageId;
    this.providerId = params.providerId;
    this.modelId = params.modelId;
    this.promptTokens = params.promptTokens;
    this.completionTokens = params.completionTokens;
    this.totalTokens = params.totalTokens;
    this.latencyMs = params.latencyMs;
    this.usedFallback = params.usedFallback ?? false;
    this.toolNames = params.toolNames ?? [];
    this.proposalIds = params.proposalIds ?? [];
    this.totalIterations = params.totalIterations ?? null;
    this.ragChunksUsed = params.ragChunksUsed ?? null;
    this.avgTopKScore = params.avgTopKScore ?? null;
    this.totalDurationMs = params.totalDurationMs ?? null;
    this.status = params.usedFallback
      ? ChatInteractionStatus.FALLBACK
      : ChatInteractionStatus.COMPLETED;
    this.update();
  }

  fail(errorCode: string, errorMessage: string): void {
    this.status = ChatInteractionStatus.FAILED;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.update();
  }

  toJSON(): EntityJson<ClinicalChatInteractionLog> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      sessionId: this.sessionId.toJSON(),
      userMessageId: this.userMessageId,
      assistantMessageId: this.assistantMessageId,
      providerId: this.providerId,
      modelId: this.modelId,
      agentProfileId: this.agentProfileId?.toJSON() ?? null,
      agentSlug: this.agentSlug,
      snapshotId: this.snapshotId?.toJSON() ?? null,
      snapshotVersion: this.snapshotVersion,
      retrievedChunkIds: this.retrievedChunkIds,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
      costUsd: this.costUsd,
      latencyMs: this.latencyMs,
      status: this.status,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      usedFallback: this.usedFallback,
      toolNames: this.toolNames,
      proposalIds: this.proposalIds,
      totalIterations: this.totalIterations,
      ragChunksUsed: this.ragChunksUsed,
      avgTopKScore: this.avgTopKScore,
      totalDurationMs: this.totalDurationMs,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: null,
    };
  }
}

export class ClinicalChatInteractionLogId extends EntityId<"ClinicalChatInteractionLogId"> {
  static from(value: string): ClinicalChatInteractionLogId {
    return new ClinicalChatInteractionLogId(value);
  }

  static generate(): ClinicalChatInteractionLogId {
    return new ClinicalChatInteractionLogId();
  }
}
