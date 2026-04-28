import {Injectable, NotFoundException} from '@nestjs/common';
import {AGENT_REGISTRY, SPECIALTY_AGENT_MAP, type AgentConfig} from './agent.config';
import {AiSpecialtyGroup} from '../../domain/form-template/entities';

/**
 * Resolve agentes clínicos a partir do AGENT_REGISTRY estático.
 *
 * Zero queries no banco — toda a lógica é baseada na configuração em memória.
 * O banco é necessário apenas para obter o UUID do AiAgentProfile (via slug).
 */
@Injectable()
export class AgentResolverService {
    resolveAgentBySpecialty(specialty: AiSpecialtyGroup): AgentConfig {
        const slug = SPECIALTY_AGENT_MAP[specialty];

        return AGENT_REGISTRY[slug];
    }

    /**
     * Retorna o AgentConfig para o slug informado.
     *
     * @throws NotFoundException se o slug não existir no AGENT_REGISTRY
     */
    resolveAgentBySlug(slug: string): AgentConfig {
        const config = AGENT_REGISTRY[slug as keyof typeof AGENT_REGISTRY];

        if (!config) {
            throw new NotFoundException(
                `Agente com slug "${slug}" não encontrado no AGENT_REGISTRY.`,
            );
        }

        return config;
    }

    /**
     * Lista todos os agentes ativos no registry com nome e modelo configurado.
     */
    getActiveAgents(): AgentConfig[] {
        return Object.values(AGENT_REGISTRY);
    }
}
