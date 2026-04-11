import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicalChatController} from './controllers/clinical-chat.controller';
import {
    // Context & RAG (Tasks 3-5)
    BuildPatientContextService,
    IndexPatientChunksService,
    RetrievePatientChunksService,
    RebuildContextSnapshotService,
    // Task 6: Snapshot management
    GetContextSnapshotService,
    InvalidateSnapshotService,
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

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicalChatController],
    providers: [
        // ─── Context & RAG ───────────────────────────────────────────────────
        BuildPatientContextService,
        IndexPatientChunksService,
        RetrievePatientChunksService,
        RebuildContextSnapshotService,

        // ─── Task 6: Snapshot management ─────────────────────────────────────
        GetContextSnapshotService,
        InvalidateSnapshotService,

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
    ],
})
export class ClinicalChatModule {}
