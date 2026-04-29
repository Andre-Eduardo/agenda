import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { z } from "zod";
import { EntityDto } from "@application/@shared/dto";
import { ChatSessionStatus } from "@domain/clinical-chat/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { entityId, pagination } from "@application/@shared/validation/schemas";
import { createZodDto } from "@application/@shared/validation/dto";
import type { PatientChatSession, AiAgentProfile } from "@domain/clinical-chat/entities";

@ApiSchema({ name: "PatientChatSession" })
export class PatientChatSessionDto extends EntityDto {
  @ApiProperty({ format: "uuid" })
  clinicId: string;

  @ApiProperty({ format: "uuid" })
  patientId: string;

  @ApiProperty({ format: "uuid", description: "ClinicMember owner of the session" })
  memberId: string;

  @ApiProperty({ format: "uuid", nullable: true })
  agentProfileId: string | null;

  /**
   * Agent display name resolved server-side based on the member's
   * professional specialty. Example: "Agente — Neurologia".
   * Filled on session creation; may be null on history listings without join.
   */
  @ApiProperty({
    nullable: true,
    description:
      "Agent name resolved automatically from the member's professional profile. " +
      'Render as "Active agent: {agentName}".',
  })
  agentName: string | null;

  @ApiProperty({ nullable: true, description: "Human-readable agent slug" })
  agentSlug: string | null;

  @ApiProperty({ nullable: true })
  title: string | null;

  @ApiProperty({ enum: ChatSessionStatus })
  status: ChatSessionStatus;

  @ApiProperty({ format: "date-time" })
  lastActivityAt: string;

  @ApiProperty({ format: "date-time", nullable: true })
  deletedAt: string | null;

  constructor(entity: PatientChatSession, resolvedAgent?: AiAgentProfile | null) {
    super(entity);
    this.clinicId = entity.clinicId.toString();
    this.patientId = entity.patientId.toString();
    this.memberId = entity.memberId.toString();
    this.agentProfileId = entity.agentProfileId?.toString() ?? null;
    this.agentName = resolvedAgent?.name ?? null;
    this.agentSlug = resolvedAgent?.slug ?? null;
    this.title = entity.title;
    this.status = entity.status;
    this.lastActivityAt = entity.lastActivityAt.toISOString();
    this.deletedAt = entity.deletedAt?.toISOString() ?? null;
  }
}

/**
 * Agent is resolved automatically server-side based on the member's specialty,
 * so the client only needs to pick the patient. The owning member is taken
 * from the actor.
 */
export const createChatSessionSchema = z.object({
  patientId: entityId(PatientId),
  title: z.string().max(255).optional(),
});

export class CreateChatSessionDto extends createZodDto(createChatSessionSchema) {}

export const listChatSessionsSchema = pagination([
  "createdAt",
  "updatedAt",
  "lastActivityAt",
] as const).extend({
  patientId: entityId(PatientId).optional(),
  memberId: entityId(ClinicMemberId).optional(),
  status: z.nativeEnum(ChatSessionStatus).optional(),
});

export class ListChatSessionsDto extends createZodDto(listChatSessionsSchema) {}
