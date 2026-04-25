import {Body, Controller, ForbiddenException, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {createZodDto} from '../../@shared/validation/dto';
import {RecordPermission} from '../../../domain/auth';
import {ApiOperation} from '../../@shared/openapi/decorators';
import type {Actor} from '../../../domain/@shared/actor';
import {Specialty} from '../../../domain/form-template/entities';
import {RetrieveKnowledgeChunksService} from '../services/retrieve-knowledge-chunks.service';

const searchKnowledgeSchema = z.object({
    query: z.string().min(1).max(1000),
    topK: z.coerce.number().int().min(1).max(20).optional(),
    specialty: z.nativeEnum(Specialty).optional(),
    category: z.string().optional(),
    minScore: z.coerce.number().min(0).max(1).optional(),
});

class SearchKnowledgeDto extends createZodDto(searchKnowledgeSchema) {}

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeDebugController {
    constructor(private readonly retrieveService: RetrieveKnowledgeChunksService) {}

    @ApiOperation({
        summary: '[DEV ONLY] Search knowledge chunks for RAG debugging',
        responses: [{status: 200, description: 'Matching chunks with scores'}],
    })
    @Authorize(RecordPermission.VIEW)
    @Post('search')
    async searchKnowledge(@RequestActor() actor: Actor, @Body() dto: SearchKnowledgeDto) {
        if (
            process.env['NODE_ENV'] !== 'development' ||
            process.env['AGENT_ENABLE_KNOWLEDGE_DEBUG'] !== 'true'
        ) {
            throw new ForbiddenException(
                'This endpoint is only available in development mode with AGENT_ENABLE_KNOWLEDGE_DEBUG=true.',
            );
        }

        return this.retrieveService.execute({
            query: dto.query,
            topK: dto.topK,
            specialty: dto.specialty,
            category: dto.category,
            // Scope retrieval to actor's clinic (plus global chunks).
            clinicId: actor.clinicId,
            minScore: dto.minScore,
        });
    }
}
