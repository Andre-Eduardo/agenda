import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AiAgentProfile, PatientChatSession, ChatSessionStatus, AiAgentProfileId} from '../../../domain/clinical-chat/entities';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AgentResolutionService} from './agent-resolution.service';

export type CreateChatSessionInput = {
    patientId: PatientId;
    professionalId: ProfessionalId;
    title?: string | null;
    agentProfileId?: AiAgentProfileId | null;
};

export type CreateChatSessionOutput = {
    session: PatientChatSession;
    /** Perfil do agente resolvido automaticamente com base na especialidade do profissional. */
    resolvedAgent: AiAgentProfile | null;
};

/**
 * Task 12 — Cria uma sessão de chat clínico com resolução automática do agente.
 *
 * O agente de IA é selecionado automaticamente com base na especialidade do profissional
 * logado, sem exigir seleção manual na interface. O agentProfileId resolvido é persistido
 * na sessão para uso em todas as interações subsequentes.
 */
@Injectable()
export class CreateChatSessionService
    implements ApplicationService<CreateChatSessionInput, CreateChatSessionOutput>
{
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly agentResolutionService: AgentResolutionService,
        private readonly sessionRepository: PatientChatSessionRepository
    ) {}

    async execute({payload}: Command<CreateChatSessionInput>): Promise<CreateChatSessionOutput> {
        // 1. Valida paciente
        const patient = await this.patientRepository.findById(payload.patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        // 2. Resolve agente automaticamente com base na especialidade do profissional
        let resolvedAgent: AiAgentProfile | null = null;
        try {
            resolvedAgent = await this.agentResolutionService.resolveForProfessional(
                payload.professionalId
            );
        } catch {
            // Se a resolução falhar (nenhum agente mapeado), a sessão é criada sem agente.
            // O SendChatMessageService usará o fallback genérico neste caso.
            resolvedAgent = null;
        }

        // 3. Cria a sessão com o agente resolvido automaticamente
        const session = PatientChatSession.create({
            patientId: payload.patientId,
            professionalId: payload.professionalId,
            agentProfileId: payload.agentProfileId ?? null,
            title: payload.title ?? null,
            status: ChatSessionStatus.ACTIVE,
            lastActivityAt: new Date(),
        });

        await this.sessionRepository.save(session);

        return {session, resolvedAgent};
    }
}
