import {Body, Controller, Get, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {
    AiAgentProfileId,
    PatientChatSessionId,
    ChatMessageRole,
} from '../../../domain/clinical-chat/entities';
import {ClinicalChatPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {PaginatedDto} from '../../@shared/dto';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '../../@shared/validation';
import {z} from 'zod';
import {entityId} from '../../@shared/validation/schemas';
import {
    AiAgentProfileDto,
    PatientChatSessionDto,
    PatientChatMessageDto,
    PatientContextSnapshotDto,
    CreateChatSessionDto,
    ListChatSessionsDto,
    ListChatMessagesDto,
    AddChatMessageDto,
    RebuildContextDto,
    RetrieveChunksDto,
    listChatSessionsSchema,
    listChatMessagesSchema,
    rebuildContextSchema,
    retrieveChunksSchema,
} from '../dtos';
import {
    CreateChatSessionService,
    GetChatSessionService,
    ListChatSessionsService,
    CloseChatSessionService,
    AddChatMessageService,
    ListChatMessagesService,
    RebuildContextSnapshotService,
    RetrievePatientChunksService,
} from '../services';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {PatientId} from '../../../domain/patient/entities';

const sessionIdSchema = z.object({id: entityId(PatientChatSessionId)});

@ApiTags('Clinical Chat')
@Controller('clinical-chat')
export class ClinicalChatController {
    constructor(
        private readonly createSessionService: CreateChatSessionService,
        private readonly getSessionService: GetChatSessionService,
        private readonly listSessionsService: ListChatSessionsService,
        private readonly closeSessionService: CloseChatSessionService,
        private readonly addMessageService: AddChatMessageService,
        private readonly listMessagesService: ListChatMessagesService,
        private readonly rebuildContextService: RebuildContextSnapshotService,
        private readonly retrieveChunksService: RetrievePatientChunksService,
        private readonly agentProfileRepository: AiAgentProfileRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository
    ) {}

    // ─── AI Agent Profiles ───────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Lists all active AI agent profiles',
        responses: [{status: 200, description: 'Agent profiles list', type: AiAgentProfileDto, isArray: true}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('agent-profiles')
    async listAgentProfiles(@RequestActor() _actor: Actor): Promise<AiAgentProfileDto[]> {
        const profiles = await this.agentProfileRepository.findAllActive();
        return profiles.map((p) => new AiAgentProfileDto(p));
    }

    // ─── Chat Sessions ───────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Creates a new clinical chat session for a patient',
        responses: [{status: 201, description: 'Session created', type: PatientChatSessionDto}],
    })
    @Authorize(ClinicalChatPermission.CREATE)
    @Post('sessions')
    async createSession(
        @RequestActor() actor: Actor,
        @Body() payload: CreateChatSessionDto
    ): Promise<PatientChatSessionDto> {
        const session = await this.createSessionService.execute({actor, payload});
        return new PatientChatSessionDto(session);
    }

    @ApiOperation({
        summary: 'Lists clinical chat sessions with filters',
        responses: [{status: 200, description: 'Sessions list'}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('sessions')
    async listSessions(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(listChatSessionsSchema)) query: ListChatSessionsDto
    ): Promise<PaginatedDto<PatientChatSessionDto>> {
        const result = await this.listSessionsService.execute({actor, payload: query});
        return {
            data: result.data.map((s) => new PatientChatSessionDto(s)),
            totalCount: result.totalCount,
        };
    }

    @ApiOperation({
        summary: 'Gets a clinical chat session by ID',
        parameters: [entityIdParam('Session ID')],
        responses: [{status: 200, description: 'Session found', type: PatientChatSessionDto}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('sessions/:id')
    async getSession(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', sessionIdSchema.shape.id) id: PatientChatSessionId
    ): Promise<PatientChatSessionDto> {
        const session = await this.getSessionService.execute({actor, payload: {sessionId: id}});
        return new PatientChatSessionDto(session);
    }

    @ApiOperation({
        summary: 'Closes a clinical chat session',
        parameters: [entityIdParam('Session ID')],
        responses: [{status: 200, description: 'Session closed', type: PatientChatSessionDto}],
    })
    @Authorize(ClinicalChatPermission.UPDATE)
    @Patch('sessions/:id/close')
    async closeSession(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', sessionIdSchema.shape.id) id: PatientChatSessionId
    ): Promise<PatientChatSessionDto> {
        const session = await this.closeSessionService.execute({actor, payload: {sessionId: id}});
        return new PatientChatSessionDto(session);
    }

    // ─── Chat Messages ───────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Adds a message to a chat session',
        parameters: [entityIdParam('Session ID')],
        responses: [{status: 201, description: 'Message added', type: PatientChatMessageDto}],
    })
    @Authorize(ClinicalChatPermission.CREATE)
    @Post('sessions/:id/messages')
    async addMessage(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', sessionIdSchema.shape.id) id: PatientChatSessionId,
        @Body() payload: AddChatMessageDto
    ): Promise<PatientChatMessageDto> {
        const message = await this.addMessageService.execute({
            actor,
            payload: {
                sessionId: id,
                role: payload.role as ChatMessageRole,
                content: payload.content,
                metadata: payload.metadata ?? null,
                chunkIds: payload.chunkIds ?? [],
            },
        });
        return new PatientChatMessageDto(message);
    }

    @ApiOperation({
        summary: 'Lists messages of a chat session',
        responses: [{status: 200, description: 'Messages list'}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('sessions/:id/messages')
    async listMessages(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', sessionIdSchema.shape.id) id: PatientChatSessionId,
        @Query(new ZodValidationPipe(listChatMessagesSchema.omit({sessionId: true}))) query: Omit<ListChatMessagesDto, 'sessionId'>
    ): Promise<PaginatedDto<PatientChatMessageDto>> {
        const result = await this.listMessagesService.execute({
            actor,
            payload: {...query, sessionId: id},
        });
        return {
            data: result.data.map((m) => new PatientChatMessageDto(m)),
            totalCount: result.totalCount,
        };
    }

    // ─── Context & RAG ───────────────────────────────────────────────────────

    @ApiOperation({
        summary: 'Rebuilds the clinical context snapshot and re-indexes chunks for a patient',
        responses: [{status: 200, description: 'Context rebuilt'}],
    })
    @Authorize(ClinicalChatPermission.REINDEX)
    @Post('context/rebuild')
    async rebuildContext(
        @RequestActor() actor: Actor,
        @Body() payload: RebuildContextDto
    ): Promise<{message: string; indexed: number}> {
        const result = await this.rebuildContextService.execute({actor, payload});
        return {
            message: 'Context rebuilt successfully.',
            indexed: result.indexing.indexed,
        };
    }

    @ApiOperation({
        summary: 'Retrieves relevant context chunks for a patient given a query',
        responses: [{status: 200, description: 'Relevant chunks retrieved'}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('context/retrieve')
    async retrieveChunks(
        @RequestActor() actor: Actor,
        @Query(new ZodValidationPipe(retrieveChunksSchema)) query: RetrieveChunksDto
    ): Promise<{chunks: PatientContextChunkDto[]; snapshotAvailable: boolean; totalChunks: number}> {
        const result = await this.retrieveChunksService.execute({
            patientId: query.patientId as PatientId,
            query: query.query,
            sourceTypes: query.sourceTypes,
            topK: query.topK,
            minScore: query.minScore,
        });
        return {
            chunks: result.chunks.map((c) => ({
                id: c.id,
                content: c.content,
                sourceType: c.sourceType,
                sourceId: c.sourceId,
                metadata: c.metadata,
                score: c.score,
            })),
            snapshotAvailable: result.snapshot !== null,
            totalChunks: result.totalChunks,
        };
    }

    @ApiOperation({
        summary: "Gets a patient's current context snapshot",
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Snapshot retrieved', type: PatientContextSnapshotDto}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('context/snapshot/:patientId')
    async getSnapshot(
        @RequestActor() _actor: Actor,
        @ValidatedParam('patientId', z.string().uuid().transform((v) => PatientId.from(v)))
        patientId: PatientId
    ): Promise<PatientContextSnapshotDto | null> {
        const snapshot = await this.snapshotRepository.findByPatient(patientId);
        return snapshot ? new PatientContextSnapshotDto(snapshot) : null;
    }
}
