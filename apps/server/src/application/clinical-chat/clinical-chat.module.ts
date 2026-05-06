import {Module} from '@nestjs/common';
import {AgentModule} from '@application/agent/agent.module';
import {AgentsController} from '@application/clinical-chat/controllers/agents.controller';
import {ClinicalChatController} from '@application/clinical-chat/controllers/clinical-chat.controller';
import {ReindexOnFormCompletedHandler} from '@application/clinical-chat/handlers/reindex-on-form-completed.handler';
import {ReindexOnRecordSavedHandler} from '@application/clinical-chat/handlers/reindex-on-record-saved.handler';
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
} from '@application/clinical-chat/services';
import {SubscriptionModule} from '@application/subscription/subscription.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {AgentResolverService} from '../../ai/agents/agent-resolver.service';

@Module({
    imports: [InfrastructureModule, AgentModule, SubscriptionModule],
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
