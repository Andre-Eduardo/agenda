import {Controller, Get} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicalChatPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {ValidatedParam} from '../../@shared/validation';
import {z} from 'zod';
import {AiAgentProfileDto} from '../dtos';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {AgentResolutionService} from '../services';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AgentMappingRule} from '../../../domain/clinical-chat/agent-resolution.config';

/**
 * Expõe o catálogo de AgentProfiles e suporte à resolução automática de agente.
 *
 * Task 12: A seleção de agente é feita automaticamente pelo backend com base
 * na especialidade do profissional. O frontend não exibe dropdown de seleção manual.
 */
@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
    constructor(
        private readonly agentProfileRepository: AiAgentProfileRepository,
        private readonly agentResolutionService: AgentResolutionService
    ) {}

    @ApiOperation({
        summary: 'Lists all active AI agent profiles',
        description:
            'Returns the versioned catalog of active clinical AI agent profiles. ' +
            'O agente ativo de uma sessão é selecionado automaticamente pelo backend ' +
            'com base na especialidade do profissional — não há seleção manual pelo usuário.',
        responses: [{status: 200, description: 'List of active agent profiles', type: AiAgentProfileDto, isArray: true}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get()
    async listAgents(@RequestActor() _actor: Actor): Promise<AiAgentProfileDto[]> {
        const profiles = await this.agentProfileRepository.findAllActive();
        return profiles.map((p) => new AiAgentProfileDto(p));
    }

    @ApiOperation({
        summary: 'Resolves the AI agent that would be used for a given professional',
        description:
            'Pré-visualiza o agente que seria selecionado automaticamente para o profissional informado. ' +
            'Use este endpoint para exibir "Agente ativo: {agentName}" antes de iniciar o chat.',
        responses: [
            {
                status: 200,
                description: 'Resolved agent profile for the professional',
                type: AiAgentProfileDto,
            },
        ],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('resolve/:professionalId')
    async resolveAgentForProfessional(
        @RequestActor() _actor: Actor,
        @ValidatedParam(
            'professionalId',
            z.string().uuid().transform((v) => ProfessionalId.from(v))
        )
        professionalId: ProfessionalId
    ): Promise<AiAgentProfileDto> {
        const agent = await this.agentResolutionService.resolveForProfessional(professionalId);
        return new AiAgentProfileDto(agent);
    }

    @ApiOperation({
        summary: 'Lists the active agent mapping rules (for diagnostics)',
        description:
            'Retorna as regras de correspondência entre especialidade profissional e agente clínico. ' +
            'Útil para diagnóstico e documentação da lógica de resolução automática.',
        responses: [{status: 200, description: 'Active mapping rules ordered by priority'}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('mapping-rules')
    listMappingRules(@RequestActor() _actor: Actor): AgentMappingRule[] {
        return this.agentResolutionService.listActiveMappingRules();
    }
}
