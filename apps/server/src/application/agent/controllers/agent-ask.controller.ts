import {Body, Controller, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {createZodDto} from '../../@shared/validation/dto';
import {RecordPermission} from '../../../domain/auth';
import {ApiOperation} from '../../@shared/openapi/decorators';
import type {Actor} from '../../../domain/@shared/actor';
import {AgentLoopService} from '../core/agent-loop.service';
import type {AgentResponse} from '../interfaces';
import type {ChatMessage} from '../../../domain/clinical-chat/ports/chat-model.provider';

const agentAskSchema = z.object({
    message: z.string().min(1).max(4000).describe('The user message or clinical question.'),
    systemPrompt: z.string().max(4000).optional().describe('Optional system prompt override.'),
    patientId: z.string().uuid().optional().describe('Optional patient UUID for patient-scoped context.'),
    sessionId: z.string().uuid().optional().describe('Optional chat session UUID.'),
    modelOverride: z.string().optional().describe('Optional model override for this call.'),
    maxIterations: z.coerce.number().int().min(1).max(10).optional(),
});

class AgentAskDto extends createZodDto(agentAskSchema) {}

@ApiTags('Agent')
@Controller('agent')
export class AgentAskController {
    constructor(private readonly agentLoop: AgentLoopService) {}

    @ApiOperation({
        summary: 'Ask the clinical agent (tool-enabled)',
        responses: [{status: 200, description: 'Agent response with answer and tool call audit trail'}],
    })
    @Authorize(RecordPermission.VIEW)
    @Post('ask')
    async ask(
        @RequestActor() actor: Actor,
        @Body() dto: AgentAskDto,
    ): Promise<AgentResponse> {
        const messages: ChatMessage[] = [];

        if (dto.systemPrompt) {
            messages.push({role: 'system', content: dto.systemPrompt});
        }

        messages.push({role: 'user', content: dto.message});

        const {PatientId} = await import('../../../domain/patient/entities');
        const {PatientChatSessionId} = await import('../../../domain/clinical-chat/entities');

        return this.agentLoop.run({
            messages,
            context: {
                actor,
                clinicId: actor.clinicId,
                memberId: actor.clinicMemberId,
                patientId: dto.patientId ? PatientId.from(dto.patientId) : undefined,
                sessionId: dto.sessionId ? PatientChatSessionId.from(dto.sessionId) : undefined,
            },
            modelOverride: dto.modelOverride,
            maxIterations: dto.maxIterations,
        });
    }
}
