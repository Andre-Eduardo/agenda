import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException, PreconditionException} from '../../../domain/@shared/exceptions';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AiAgentProfile} from '../../../domain/clinical-chat/entities';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {
    AGENT_MAPPING_RULES,
    normalizeSpecialtyText,
    type AgentMappingRule,
} from '../../../domain/clinical-chat/agent-resolution.config';

/**
 * Task 12 — Serviço de resolução automática de agente por profissão do profissional.
 *
 * Resolve o AiAgentProfile adequado com base no perfil de especialidade do profissional
 * cadastrado no sistema, sem exigir seleção manual pelo usuário.
 *
 * Cadeia de fallback:
 * 1. Correspondência por profissão (specialtyNormalized) + padrão de texto de especialidade
 * 2. Correspondência por profissão (specialtyNormalized) — agente padrão da área
 * 3. Agente genérico (specialty = null)
 * 4. PreconditionException — nenhum agente mapeado encontrado
 */
@Injectable()
export class AgentResolutionService {
    constructor(
        private readonly professionalRepository: ProfessionalRepository,
        private readonly agentProfileRepository: AiAgentProfileRepository
    ) {}

    /**
     * Resolve o AiAgentProfile mais adequado para o profissional informado.
     *
     * @param professionalId - ID do profissional logado
     * @returns AiAgentProfile resolvido (nunca null — lança exceção se não encontrado)
     * @throws ResourceNotFoundException se o profissional não existir
     * @throws PreconditionException se nenhum agente mapeado estiver disponível
     */
    async resolveForProfessional(professionalId: ProfessionalId): Promise<AiAgentProfile> {
        // 1. Carrega o profissional e seu perfil de especialidade
        const professional = await this.professionalRepository.findById(professionalId);
        if (!professional) {
            throw new ResourceNotFoundException('Professional not found.', professionalId.toString());
        }

        const specialtyNormalized = professional.specialtyNormalized;
        const specialtyText = professional.specialty
            ? normalizeSpecialtyText(professional.specialty)
            : null;

        // 2. Filtra regras ativas e ordena por prioridade (maior primeiro)
        const activeRules = AGENT_MAPPING_RULES.filter((r) => r.isActive).sort(
            (a, b) => b.priority - a.priority
        );

        // 3. Tenta correspondência por profissão + texto de especialidade
        if (specialtyNormalized && specialtyText) {
            const specificRule = activeRules.find(
                (r) =>
                    r.professionType === specialtyNormalized &&
                    r.specialtyTextPattern !== undefined &&
                    specialtyText.includes(r.specialtyTextPattern)
            );
            if (specificRule) {
                const agent = await this.findAgentByCode(specificRule.agentCode);
                if (agent) return agent;
            }
        }

        // 4. Fallback: correspondência por profissão (regra padrão da área, sem specialtyTextPattern)
        if (specialtyNormalized) {
            const defaultRule = activeRules.find(
                (r) =>
                    r.professionType === specialtyNormalized &&
                    r.specialtyTextPattern === undefined
            );
            if (defaultRule) {
                const agent = await this.findAgentByCode(defaultRule.agentCode);
                if (agent) return agent;
            }
        }

        // 5. Fallback final: agente genérico (specialty = null)
        const genericAgent = await this.resolveGenericAgent();
        if (genericAgent) return genericAgent;

        // 6. Nenhum agente disponível — erro controlado
        throw new PreconditionException(
            'Nenhum agente de IA disponível para o perfil profissional cadastrado. ' +
                'Verifique se a especialidade do profissional está configurada e se há agentes ativos no sistema.'
        );
    }

    /**
     * Retorna o nome do agente resolvido para exibição contextual na interface.
     * Formato: "Agente ativo: {nome}"
     */
    async resolveAgentDisplayName(professionalId: ProfessionalId): Promise<string> {
        const agent = await this.resolveForProfessional(professionalId);
        return agent.name;
    }

    private async findAgentByCode(code: string): Promise<AiAgentProfile | null> {
        const allActive = await this.agentProfileRepository.findAllActive();
        return allActive.find((p) => p.code === code) ?? null;
    }

    private async resolveGenericAgent(): Promise<AiAgentProfile | null> {
        const allActive = await this.agentProfileRepository.findAllActive();
        // Prefer specialty=null (generic) agent; fallback to first active
        return allActive.find((p) => p.specialty === null) ?? allActive[0] ?? null;
    }

    /**
     * Retorna todas as regras de mapeamento ativas, ordenadas por prioridade.
     * Útil para diagnóstico e documentação da resolução.
     */
    listActiveMappingRules(): AgentMappingRule[] {
        return AGENT_MAPPING_RULES.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);
    }
}
