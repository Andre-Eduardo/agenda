import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { z } from "zod";
import { createZodDto } from "@application/@shared/validation/dto";
import { ChatInteractionStatus } from "@domain/clinical-chat/entities";
import type {
  ClinicalChatInteractionLog,
  PatientChatMessage,
} from "@domain/clinical-chat/entities";
import { PatientChatMessageDto } from "@application/clinical-chat/dtos/patient-chat-message.dto";

// ─── Input DTO ───────────────────────────────────────────────────────────────

export const sendChatMessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty").max(10_000, "Message too long"),
  topK: z.coerce.number().int().min(1).max(20).optional().default(8),
  minScore: z.coerce.number().min(0).max(1).optional().default(0),
});

export class SendChatMessageDto extends createZodDto(sendChatMessageSchema) {}

// ─── Interaction Log DTO ─────────────────────────────────────────────────────

@ApiSchema({ name: "ChatInteractionLog" })
export class ChatInteractionLogDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ format: "uuid" })
  sessionId: string;

  @ApiProperty({ format: "uuid" })
  userMessageId: string;

  @ApiProperty({ format: "uuid", nullable: true })
  assistantMessageId: string | null;

  @ApiProperty({ nullable: true })
  providerId: string | null;

  @ApiProperty({ nullable: true })
  modelId: string | null;

  @ApiProperty({ nullable: true })
  agentSlug: string | null;

  @ApiProperty({ isArray: true, type: String })
  retrievedChunkIds: string[];

  @ApiProperty({ nullable: true, type: Number })
  promptTokens: number | null;

  @ApiProperty({ nullable: true, type: Number })
  completionTokens: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalTokens: number | null;

  @ApiProperty({ nullable: true, type: Number })
  latencyMs: number | null;

  @ApiProperty({ enum: ChatInteractionStatus })
  status: ChatInteractionStatus;

  @ApiProperty({ nullable: true })
  errorCode: string | null;

  @ApiProperty()
  usedFallback: boolean;

  @ApiProperty()
  createdAt: string;

  constructor(entity: ClinicalChatInteractionLog) {
    this.id = entity.id.toString();
    this.sessionId = entity.sessionId.toString();
    this.userMessageId = entity.userMessageId;
    this.assistantMessageId = entity.assistantMessageId;
    this.providerId = entity.providerId;
    this.modelId = entity.modelId;
    this.agentSlug = entity.agentSlug;
    this.retrievedChunkIds = entity.retrievedChunkIds;
    this.promptTokens = entity.promptTokens;
    this.completionTokens = entity.completionTokens;
    this.totalTokens = entity.totalTokens;
    this.latencyMs = entity.latencyMs;
    this.status = entity.status;
    this.errorCode = entity.errorCode;
    this.usedFallback = entity.usedFallback;
    this.createdAt = entity.createdAt.toISOString();
  }
}

// ─── Response DTO ─────────────────────────────────────────────────────────────

@ApiSchema({ name: "SendChatMessageResponse" })
export class SendChatMessageResponseDto {
  @ApiProperty({ type: PatientChatMessageDto })
  userMessage: PatientChatMessageDto;

  @ApiProperty({ type: PatientChatMessageDto })
  assistantMessage: PatientChatMessageDto;

  @ApiProperty({ type: ChatInteractionLogDto })
  interactionLog: ChatInteractionLogDto;

  constructor(params: {
    userMessage: PatientChatMessage;
    assistantMessage: PatientChatMessage;
    interactionLog: ClinicalChatInteractionLog;
  }) {
    this.userMessage = new PatientChatMessageDto(params.userMessage);
    this.assistantMessage = new PatientChatMessageDto(params.assistantMessage);
    this.interactionLog = new ChatInteractionLogDto(params.interactionLog);
  }
}

// ─── Context Inspect DTO ─────────────────────────────────────────────────────

@ApiSchema({ name: "SessionContextInspect" })
export class SessionContextInspectDto {
  @ApiProperty({ format: "uuid" })
  sessionId!: string;

  @ApiProperty({ format: "uuid" })
  patientId!: string;

  @ApiProperty({ nullable: true })
  snapshotStatus!: string | null;

  @ApiProperty({ nullable: true })
  snapshotBuiltAt!: string | null;

  @ApiProperty({ nullable: true })
  snapshotContentHash!: string | null;

  @ApiProperty({ type: Number })
  totalChunksIndexed!: number;

  @ApiProperty({ isArray: true, type: String })
  registeredProviders!: string[];

  @ApiProperty()
  providerHealthy!: boolean;
}
