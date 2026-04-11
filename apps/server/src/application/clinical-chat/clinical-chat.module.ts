import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicalChatController} from './controllers/clinical-chat.controller';
import {
    BuildPatientContextService,
    IndexPatientChunksService,
    RetrievePatientChunksService,
    CreateChatSessionService,
    GetChatSessionService,
    ListChatSessionsService,
    CloseChatSessionService,
    AddChatMessageService,
    ListChatMessagesService,
    RebuildContextSnapshotService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicalChatController],
    providers: [
        // Context & RAG
        BuildPatientContextService,
        IndexPatientChunksService,
        RetrievePatientChunksService,
        RebuildContextSnapshotService,
        // Chat sessions
        CreateChatSessionService,
        GetChatSessionService,
        ListChatSessionsService,
        CloseChatSessionService,
        // Chat messages
        AddChatMessageService,
        ListChatMessagesService,
    ],
})
export class ClinicalChatModule {}
