import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ClinicId} from '../../../domain/clinic/entities';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {AiAgentProfile, PatientChatSession, ChatSessionStatus, AiAgentProfileId} from '../../../domain/clinical-chat/entities';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AgentResolutionService} from './agent-resolution.service';

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
 * The AI agent is selected based on the member's specialty (when the member
 * has a Professional 1:1 with a specialty). The resolved agentProfileId is
 * persisted on the session for use in subsequent interactions.
 */
@Injectable()
export class CreateChatSessionService
    implements ApplicationService<CreateChatSessionInput, CreateChatSessionOutput>
{
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly agentResolutionService: AgentResolutionService,
        private readonly sessionRepository: PatientChatSessionRepository,
    ) {}

    async execute({payload}: Command<CreateChatSessionInput>): Promise<CreateChatSessionOutput> {
        const patient = await this.patientRepository.findById(payload.patientId, payload.clinicId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        // Resolve agent based on member's specialty. If no agent is mapped to
        // this member's specialty, fall back to the generic agent at message time.
        let resolvedAgent: AiAgentProfile | null = null;
        try {
            resolvedAgent = await this.agentResolutionService.resolveForMember(payload.memberId);
        } catch {
            resolvedAgent = null;
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

        return {session, resolvedAgent};
    }
}
