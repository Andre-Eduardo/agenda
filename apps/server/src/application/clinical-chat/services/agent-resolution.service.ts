import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {AiAgentProfile} from '../../../domain/clinical-chat/entities';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {
    AGENT_MAPPING_RULES,
    normalizeSpecialtyText,
    type AgentMappingRule,
} from '../../../domain/clinical-chat/agent-resolution.config';

/**
 * Resolves the appropriate AiAgentProfile for a member based on the
 * Professional record they extend (when role=PROFESSIONAL).
 *
 * Resolution chain:
 * 1. Match by profession (specialtyNormalized) + specialty text pattern
 * 2. Match by profession alone (default agent for the area)
 * 3. Generic agent (specialty=null)
 * 4. PreconditionException — no agent mapped
 *
 * Members without a linked Professional (SECRETARY/ADMIN/OWNER/VIEWER) fall
 * straight through to step 3 (generic agent).
 */
@Injectable()
export class AgentResolutionService {
    constructor(
        private readonly professionalRepository: ProfessionalRepository,
        private readonly agentProfileRepository: AiAgentProfileRepository,
    ) {}

    /**
     * Resolve the AiAgentProfile for a given clinic member.
     *
     * @throws ResourceNotFoundException — member has role=PROFESSIONAL but Professional record is missing
     * @throws PreconditionException — no mapped agent available
     */
    async resolveForMember(memberId: ClinicMemberId): Promise<AiAgentProfile> {
        // Members without a Professional record (e.g. SECRETARY) get the generic agent.
        const professional = await this.professionalRepository.findByClinicMemberId(memberId);

        if (professional === null) {
            const genericAgent = await this.resolveGenericAgent();
            if (genericAgent) return genericAgent;
            throw new PreconditionException(
                'No AI agent available for this clinic member. Configure agents in the system before starting a chat.',
            );
        }

        const specialtyNormalized = professional.specialtyNormalized;
        const specialtyText = professional.specialty
            ? normalizeSpecialtyText(professional.specialty)
            : null;

        const activeRules = AGENT_MAPPING_RULES.filter((r) => r.isActive).sort(
            (a, b) => b.priority - a.priority,
        );

        // 1. Match by profession + specialty text pattern
        if (specialtyNormalized && specialtyText) {
            const specificRule = activeRules.find(
                (r) =>
                    r.professionType === specialtyNormalized &&
                    r.specialtyTextPattern !== undefined &&
                    specialtyText.includes(r.specialtyTextPattern),
            );
            if (specificRule) {
                const agent = await this.findAgentByCode(specificRule.agentCode);
                if (agent) return agent;
            }
        }

        // 2. Default rule for this profession
        if (specialtyNormalized) {
            const defaultRule = activeRules.find(
                (r) => r.professionType === specialtyNormalized && r.specialtyTextPattern === undefined,
            );
            if (defaultRule) {
                const agent = await this.findAgentByCode(defaultRule.agentCode);
                if (agent) return agent;
            }
        }

        // 3. Generic fallback
        const genericAgent = await this.resolveGenericAgent();
        if (genericAgent) return genericAgent;

        throw new PreconditionException(
            'No AI agent matched the member\'s profile and no generic agent is configured.',
        );
    }

    async resolveAgentDisplayName(memberId: ClinicMemberId): Promise<string> {
        const agent = await this.resolveForMember(memberId);
        return agent.name;
    }

    private async findAgentByCode(code: string): Promise<AiAgentProfile | null> {
        const allActive = await this.agentProfileRepository.findAllActive();
        return allActive.find((p) => p.code === code) ?? null;
    }

    private async resolveGenericAgent(): Promise<AiAgentProfile | null> {
        const allActive = await this.agentProfileRepository.findAllActive();
        return allActive.find((p) => p.specialtyGroup === null) ?? allActive[0] ?? null;
    }

    listActiveMappingRules(): AgentMappingRule[] {
        return AGENT_MAPPING_RULES.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);
    }
}
