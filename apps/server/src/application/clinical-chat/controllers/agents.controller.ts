import {Controller, Get} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicalChatPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {AiAgentProfileDto} from '../dtos';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';

/**
 * Expõe o catálogo de AgentProfiles ativos para consumo do frontend.
 * Utilizado pelo dropdown de seleção de agente no chat clínico.
 */
@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
    constructor(private readonly agentProfileRepository: AiAgentProfileRepository) {}

    @ApiOperation({
        summary: 'Lists all active AI agent profiles',
        description:
            'Returns the versioned catalog of active clinical AI agent profiles. ' +
            'Used by the frontend to populate the agent selection dropdown in the chat interface.',
        responses: [{status: 200, description: 'List of active agent profiles', type: AiAgentProfileDto, isArray: true}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get()
    async listAgents(@RequestActor() _actor: Actor): Promise<AiAgentProfileDto[]> {
        const profiles = await this.agentProfileRepository.findAllActive();
        return profiles.map((p) => new AiAgentProfileDto(p));
    }
}
