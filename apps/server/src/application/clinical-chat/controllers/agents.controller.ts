import {Controller, Get} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicalChatPermission} from '../../../domain/auth';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {AgentMappingRule} from '../../../domain/clinical-chat/agent-resolution.config';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {ValidatedParam} from '../../@shared/validation';
import {AiAgentProfileDto} from '../dtos';
import {AgentResolutionService} from '../services';

/**
 * Catalog of AgentProfiles and support for the auto-resolution endpoint.
 *
 * Agent selection happens server-side based on the calling member's
 * specialty — there's no manual dropdown on the frontend.
 */
@ApiTags('Agents')
@Controller('agents')
export class AgentsController {
    constructor(
        private readonly agentProfileRepository: AiAgentProfileRepository,
        private readonly agentResolutionService: AgentResolutionService,
    ) {}

    @ApiOperation({
        summary: 'Lists all active AI agent profiles',
        description:
            'Returns the versioned catalog of active clinical AI agent profiles. ' +
            'The active agent for a session is selected automatically server-side based on the member\'s specialty.',
        responses: [{status: 200, description: 'List of active agent profiles', type: AiAgentProfileDto, isArray: true}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get()
    async listAgents(@RequestActor() _actor: Actor): Promise<AiAgentProfileDto[]> {
        const profiles = await this.agentProfileRepository.findAllActive();
        return profiles.map((p) => new AiAgentProfileDto(p));
    }

    @ApiOperation({
        summary: 'Resolve the AI agent for a given clinic member',
        description:
            'Previews which agent would be picked automatically for the given member. ' +
            'Use this to render "Active agent: {agentName}" before starting a chat session.',
        responses: [
            {
                status: 200,
                description: 'Resolved agent profile for the member',
                type: AiAgentProfileDto,
            },
        ],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('resolve/:clinicMemberId')
    async resolveAgentForMember(
        @RequestActor() _actor: Actor,
        @ValidatedParam(
            'clinicMemberId',
            z.string().uuid().transform((v) => ClinicMemberId.from(v)),
        )
        clinicMemberId: ClinicMemberId,
    ): Promise<AiAgentProfileDto> {
        const agent = await this.agentResolutionService.resolveForMember(clinicMemberId);
        return new AiAgentProfileDto(agent);
    }

    @ApiOperation({
        summary: 'Lists the active agent mapping rules (for diagnostics)',
        description: 'Returns the rules matching member specialty to clinical agent. Useful for debugging the auto-resolution logic.',
        responses: [{status: 200, description: 'Active mapping rules ordered by priority'}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('mapping-rules')
    listMappingRules(@RequestActor() _actor: Actor): AgentMappingRule[] {
        return this.agentResolutionService.listActiveMappingRules();
    }
}
