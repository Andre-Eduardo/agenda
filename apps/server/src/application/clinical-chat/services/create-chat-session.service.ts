import { Injectable, Logger } from "@nestjs/common";
import { ResourceNotFoundException } from "@domain/@shared/exceptions";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientRepository } from "@domain/patient/patient.repository";
import { PatientId } from "@domain/patient/entities";
import { ProfessionalRepository } from "@domain/professional/professional.repository";
import { AiAgentProfileRepository } from "@domain/clinical-chat/ai-agent-profile.repository";
import {
  AiAgentProfile,
  PatientChatSession,
  ChatSessionStatus,
  AiAgentProfileId,
} from "@domain/clinical-chat/entities";
import { PatientChatSessionRepository } from "@domain/clinical-chat/patient-chat-session.repository";
import { ApplicationService, Command } from "@application/@shared/application.service";
import { AgentResolverService } from "../../../ai/agents/agent-resolver.service";

export type CreateChatSessionInput = {
  clinicId: ClinicId;
  memberId: ClinicMemberId;
  patientId: PatientId;
  title?: string | null;
  agentProfileId?: AiAgentProfileId | null;
};

export type CreateChatSessionOutput = {
  session: PatientChatSession;
  /** Agent resolved automatically based on the member's specialty. */
  resolvedAgent: AiAgentProfile | null;
};

/**
 * Creates a clinical chat session with automatic agent resolution.
 *
 * Resolution flow:
 * 1. Fetch the member's Professional record to get specialtyNormalized
 * 2. AgentResolverService.resolveAgentBySpecialty(specialty) → AgentConfig (no DB query)
 * 3. Find AiAgentProfile in DB by slug
 * 4. If not found, log a warning and fall back to null (sync:agents should be run)
 * 5. Create session with resolved agentProfileId
 */
@Injectable()
export class CreateChatSessionService implements ApplicationService<
  CreateChatSessionInput,
  CreateChatSessionOutput
> {
  private readonly logger = new Logger(CreateChatSessionService.name);

  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly professionalRepository: ProfessionalRepository,
    private readonly agentResolverService: AgentResolverService,
    private readonly agentProfileRepository: AiAgentProfileRepository,
    private readonly sessionRepository: PatientChatSessionRepository,
  ) {}

  async execute({ payload }: Command<CreateChatSessionInput>): Promise<CreateChatSessionOutput> {
    const patient = await this.patientRepository.findById(payload.patientId, payload.clinicId);

    if (!patient) {
      throw new ResourceNotFoundException("Patient not found.", payload.patientId.toString());
    }

    let resolvedAgent: AiAgentProfile | null = null;

    if (!payload.agentProfileId) {
      resolvedAgent = await this.resolveAgentForMember(payload.memberId);
    }

    const session = PatientChatSession.create({
      clinicId: payload.clinicId,
      patientId: payload.patientId,
      memberId: payload.memberId,
      agentProfileId: payload.agentProfileId ?? resolvedAgent?.id ?? null,
      title: payload.title ?? null,
      status: ChatSessionStatus.ACTIVE,
      lastActivityAt: new Date(),
    });

    await this.sessionRepository.save(session);

    return { session, resolvedAgent };
  }

  private async resolveAgentForMember(memberId: ClinicMemberId): Promise<AiAgentProfile | null> {
    try {
      const professional = await this.professionalRepository.findByClinicMemberId(memberId);

      if (!professional?.specialtyNormalized) {
        return await this.fallbackToGenericAgent();
      }

      const agentConfig = this.agentResolverService.resolveAgentBySpecialty(
        professional.specialtyNormalized,
      );

      const agentProfile = await this.agentProfileRepository.findBySlug(agentConfig.slug);

      if (!agentProfile) {
        this.logger.warn(
          `AiAgentProfile com slug "${agentConfig.slug}" não encontrado no banco. ` +
            'Execute "pnpm sync:agents" para sincronizar o registry com o banco.',
        );

        return await this.fallbackToGenericAgent();
      }

      return agentProfile;
    } catch (error) {
      this.logger.warn(
        `Falha ao resolver agente para membro ${memberId.toString()}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return null;
    }
  }

  private async fallbackToGenericAgent(): Promise<AiAgentProfile | null> {
    const allActive = await this.agentProfileRepository.findAllActive();

    return allActive.find((p) => p.specialtyGroup === null) ?? allActive[0] ?? null;
  }
}
