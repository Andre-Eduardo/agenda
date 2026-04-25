import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AgentModule} from '../agent/agent.module';
import {ClinicalChatController} from './controllers/clinical-chat.controller';
import {AgentsController} from './controllers/agents.controller';
import {AgentResolverService} from '../../ai/agents/agent-resolver.service';
import {
    // Task 14: Context policy rules
    ContextPolicyService,
    // Context & RAG (Tasks 3-5)
    BuildPatientContextService,
    IndexPatientChunksService,
    RetrievePatientChunksService,
    RebuildContextSnapshotService,
    // Task 6: Snapshot management
    GetContextSnapshotService,
    InvalidateSnapshotService,
    // Task 12: Agent auto-resolution (legacy — used by AgentsController)
    AgentResolutionService,
    // Chat sessions (Tasks 4-5)
    CreateChatSessionService,
    GetChatSessionService,
    ListChatSessionsService,
    CloseChatSessionService,
    // Chat messages (Tasks 4-5)
    AddChatMessageService,
    ListChatMessagesService,
    // Task 8: Main chat orchestrator
    SendChatMessageService,
} from './services';
import {ReindexOnRecordSavedHandler} from './handlers/reindex-on-record-saved.handler';
import {ReindexOnFormCompletedHandler} from './handlers/reindex-on-form-completed.handler';

@Module({
    imports: [InfrastructureModule, AgentModule],
    controllers: [ClinicalChatController, AgentsController],
    providers: [
        // ─── Task 14: Context policy rules ───────────────────────────────────
        ContextPolicyService,

        // ─── Context & RAG ───────────────────────────────────────────────────
        BuildPatientContextService,
        IndexPatientChunksService,
        RetrievePatientChunksService,
        RebuildContextSnapshotService,

        // ─── Task 6: Snapshot management ─────────────────────────────────────
        GetContextSnapshotService,
        InvalidateSnapshotService,

        // ─── Agent registry resolver (zero-DB, env-driven) ───────────────────
        AgentResolverService,

        // ─── Task 12: Agent auto-resolution (legacy — used by AgentsController) ─
        AgentResolutionService,

        // ─── Chat sessions ───────────────────────────────────────────────────
        CreateChatSessionService,
        GetChatSessionService,
        ListChatSessionsService,
        CloseChatSessionService,

        // ─── Chat messages ───────────────────────────────────────────────────
        AddChatMessageService,
        ListChatMessagesService,

        // ─── Task 8: Main chat orchestrator ──────────────────────────────────
        SendChatMessageService,

        // ─── Phase 4: Auto re-index handlers ─────────────────────────────────
        ReindexOnRecordSavedHandler,
        ReindexOnFormCompletedHandler,
    ],
})
export class ClinicalChatModule {}
