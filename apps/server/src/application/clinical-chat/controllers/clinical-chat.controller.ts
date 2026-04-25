import {Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {UseUsageLimit} from '../../subscription/decorators/use-usage-limit.decorator';
import {Actor} from '../../../domain/@shared/actor';
import {
    PatientChatSessionId,
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
    PatientContextChunkDto,
    CreateChatSessionDto,
    ListChatSessionsDto,
    ListChatMessagesDto,
    AddChatMessageDto,
    RebuildContextDto,
    RetrieveChunksDto,
    SendChatMessageDto,
    SendChatMessageResponseDto,
    SessionContextInspectDto,
    listChatSessionsSchema,
    listChatMessagesSchema,
    rebuildContextSchema,
    retrieveChunksSchema,
    sendChatMessageSchema,
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
    GetContextSnapshotService,
    InvalidateSnapshotService,
    SendChatMessageService,
} from '../services';
import {AiAgentProfileRepository} from '../../../domain/clinical-chat/ai-agent-profile.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {PatientContextChunkRepository} from '../../../domain/clinical-chat/patient-context-chunk.repository';
import {AiProviderRegistry} from '../../../domain/clinical-chat/ports/ai-provider-registry.port';
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
        private readonly getSnapshotService: GetContextSnapshotService,
        private readonly invalidateSnapshotService: InvalidateSnapshotService,
        private readonly sendChatMessageService: SendChatMessageService,
        private readonly agentProfileRepository: AiAgentProfileRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository,
        private readonly chunkRepository: PatientContextChunkRepository,
        private readonly aiProviderRegistry: AiProviderRegistry
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
        description:
            'O agente de IA é selecionado automaticamente com base na especialidade ' +
            'do profissional logado. A resposta inclui `agentName` e `agentSlug` para ' +
            'exibição contextual na interface (ex: "Agente ativo: Neurologia").',
        responses: [{status: 201, description: 'Session created', type: PatientChatSessionDto}],
    })
    @Authorize(ClinicalChatPermission.CREATE)
    @Post('sessions')
    async createSession(
        @RequestActor() actor: Actor,
        @Body() payload: CreateChatSessionDto,
    ): Promise<PatientChatSessionDto> {
        const result = await this.createSessionService.execute({
            actor,
            payload: {
                clinicId: actor.clinicId,
                memberId: actor.clinicMemberId,
                patientId: payload.patientId,
                title: payload.title ?? null,
            },
        });
        return new PatientChatSessionDto(result.session, result.resolvedAgent);
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

    /**
     * Endpoint principal de chat com IA.
     * Orquestra: contexto → snapshot → RAG → provider → persistência → resposta.
     * Substitui o fluxo simples de addMessage para interações com IA.
     */
    @ApiOperation({
        summary: 'Sends a message to the clinical chat and gets an AI-generated response',
        description:
            'Main clinical chat endpoint. Retrieves patient context, calls AI provider, ' +
            'persists user message + assistant response, and returns structured output with audit log.',
        parameters: [entityIdParam('Session ID')],
        responses: [{status: 200, description: 'User message + assistant response', type: SendChatMessageResponseDto}],
    })
    @Authorize(ClinicalChatPermission.CREATE)
    @UseUsageLimit('chat')
    @HttpCode(HttpStatus.OK)
    @Post('sessions/:id/chat')
    async sendChatMessage(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', sessionIdSchema.shape.id) id: PatientChatSessionId,
        @Body() payload: SendChatMessageDto
    ): Promise<SendChatMessageResponseDto> {
        const result = await this.sendChatMessageService.execute({
            actor,
            payload: {
                sessionId: id,
                content: payload.content,
                topK: payload.topK,
                minScore: payload.minScore,
            },
        });

        return new SendChatMessageResponseDto(result);
    }

    /**
     * Endpoint legado para inserção manual de mensagem sem processamento de IA.
     * Útil para testes ou inserção de mensagens de sistema/contexto.
     */
    @ApiOperation({
        summary: 'Manually adds a message to a chat session (no AI processing)',
        description: 'Use /chat endpoint for AI-powered responses. This endpoint only persists the message directly.',
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
                role: payload.role,
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
        summary: 'Invalidates the current clinical snapshot for a patient (marks as stale)',
        description: 'Call this when patient data changes. Next /context/snapshot access will trigger rebuild.',
        responses: [{status: 200, description: 'Invalidation result'}],
    })
    @Authorize(ClinicalChatPermission.REINDEX)
    @Post('context/invalidate')
    async invalidateSnapshot(
        @RequestActor() _actor: Actor,
        @Body() payload: RebuildContextDto
    ): Promise<{invalidated: boolean; previousStatus: string | null}> {
        const result = await this.invalidateSnapshotService.execute({
            patientId: payload.patientId,
            reason: 'Manual invalidation via API',
        });
        return {
            invalidated: result.invalidated,
            previousStatus: result.previousStatus,
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
        @Query(new ZodValidationPipe(retrieveChunksSchema)) query: RetrieveChunksDto,
    ): Promise<{chunks: PatientContextChunkDto[]; snapshotAvailable: boolean; totalChunks: number}> {
        const result = await this.retrieveChunksService.execute({
            patientId: query.patientId,
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
                clinicId: actor.clinicId.toString(),
                patientId: c.patientId,
                chunkIndex: c.chunkIndex,
                contentHash: c.contentHash,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.updatedAt.toISOString(),
            })),
            snapshotAvailable: !!result.snapshot,
            totalChunks: result.totalChunks,
        };
    }

    @ApiOperation({
        summary: "Gets a patient's current context snapshot (rebuilds if stale or missing)",
        parameters: [entityIdParam('Patient ID', 'patientId')],
        responses: [{status: 200, description: 'Snapshot retrieved', type: PatientContextSnapshotDto}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('context/snapshot/:patientId')
    async getSnapshot(
        @RequestActor() actor: Actor,
        @ValidatedParam('patientId', z.string().uuid().transform((v) => PatientId.from(v)))
        patientId: PatientId,
    ): Promise<{snapshot: PatientContextSnapshotDto | null; wasRebuilt: boolean; isStale: boolean}> {
        const result = await this.getSnapshotService.execute({
            clinicId: actor.clinicId,
            patientId,
            autoRebuildIfStale: false, // Direct lookup never rebuilds — explicit rebuild endpoint exists.
        });
        return {
            snapshot: result.snapshot ? new PatientContextSnapshotDto(result.snapshot) : null,
            wasRebuilt: result.wasRebuilt,
            isStale: result.isStale,
        };
    }

    /**
     * Inspeciona o estado de contexto + provider de uma sessão.
     * Útil para diagnóstico e debugging do pipeline de chat.
     */
    @ApiOperation({
        summary: 'Inspects the current context and provider state for a session',
        parameters: [entityIdParam('Session ID')],
        responses: [{status: 200, description: 'Session context state', type: SessionContextInspectDto}],
    })
    @Authorize(ClinicalChatPermission.VIEW)
    @Get('sessions/:id/inspect')
    async inspectSession(
        @RequestActor() _actor: Actor,
        @ValidatedParam('id', sessionIdSchema.shape.id) id: PatientChatSessionId
    ): Promise<SessionContextInspectDto> {
        const session = await this.getSessionService.execute({
            actor: _actor,
            payload: {sessionId: id},
        });

        const patientId = session.patientId;

        const [snapshot, totalIndexed, providerHealth] = await Promise.all([
            this.snapshotRepository.findByPatient(patientId),
            this.chunkRepository.countByPatient(patientId),
            this.aiProviderRegistry.healthCheckAll(),
        ]);
        const registeredProviders = this.aiProviderRegistry.listRegisteredProviders();
        const allHealthy = Object.values(providerHealth).every(Boolean);

        return {
            sessionId: id.toString(),
            patientId: patientId.toString(),
            snapshotStatus: snapshot?.status ?? null,
            snapshotBuiltAt: snapshot?.builtAt?.toISOString() ?? null,
            snapshotContentHash: snapshot?.contentHash ?? null,
            totalChunksIndexed: totalIndexed,
            registeredProviders,
            providerHealthy: allHealthy,
        };
    }
}
