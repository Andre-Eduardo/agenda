import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PatientRepository} from '../../../domain/patient/patient.repository';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AiAgentProfileId, PatientChatSession} from '../../../domain/clinical-chat/entities';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {PatientChatSessionRepository} from '../../../domain/clinical-chat/patient-chat-session.repository';
import {ApplicationService, Command} from '../../@shared/application.service';

export type CreateChatSessionInput = {
    patientId: PatientId;
    professionalId: ProfessionalId;
    agentProfileId?: AiAgentProfileId | null;
    title?: string | null;
};

export type CreateChatSessionOutput = PatientChatSession;

@Injectable()
export class CreateChatSessionService
    implements ApplicationService<CreateChatSessionInput, CreateChatSessionOutput>
{
    constructor(
        private readonly patientRepository: PatientRepository,
        private readonly agentProfileRepository: AiAgentProfileRepository,
        private readonly sessionRepository: PatientChatSessionRepository
    ) {}

    async execute({payload}: Command<CreateChatSessionInput>): Promise<CreateChatSessionOutput> {
        const patient = await this.patientRepository.findById(payload.patientId);
        if (!patient) {
            throw new ResourceNotFoundException('Patient not found.', payload.patientId.toString());
        }

        if (payload.agentProfileId) {
            const profile = await this.agentProfileRepository.findById(payload.agentProfileId);
            if (!profile) {
                throw new ResourceNotFoundException('AI agent profile not found.', payload.agentProfileId.toString());
            }
        }

        const session = PatientChatSession.create({
            patientId: payload.patientId,
            professionalId: payload.professionalId,
            agentProfileId: payload.agentProfileId ?? null,
            title: payload.title ?? null,
        });

        await this.sessionRepository.save(session);

        return session;
    }
}
