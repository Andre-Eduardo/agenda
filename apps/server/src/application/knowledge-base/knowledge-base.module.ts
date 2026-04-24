import {Module} from '@nestjs/common';
import {KnowledgeDebugController} from './controllers/knowledge-debug.controller';
import {ChunkTextService} from './services/chunk-text.service';
import {IngestKnowledgeDocumentService} from './services/ingest-knowledge-document.service';
import {RetrieveKnowledgeChunksService} from './services/retrieve-knowledge-chunks.service';

@Module({
    controllers: [KnowledgeDebugController],
    providers: [
        ChunkTextService,
        IngestKnowledgeDocumentService,
        RetrieveKnowledgeChunksService,
    ],
    exports: [
        ChunkTextService,
        IngestKnowledgeDocumentService,
        RetrieveKnowledgeChunksService,
    ],
})
export class KnowledgeBaseModule {}
