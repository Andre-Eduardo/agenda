import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { KnowledgeDebugController } from "@application/knowledge-base/controllers/knowledge-debug.controller";
import { ChunkTextService } from "@application/knowledge-base/services/chunk-text.service";
import { IngestKnowledgeDocumentService } from "@application/knowledge-base/services/ingest-knowledge-document.service";
import { RetrieveKnowledgeChunksService } from "@application/knowledge-base/services/retrieve-knowledge-chunks.service";

@Module({
  imports: [InfrastructureModule],
  controllers: [KnowledgeDebugController],
  providers: [ChunkTextService, IngestKnowledgeDocumentService, RetrieveKnowledgeChunksService],
  exports: [ChunkTextService, IngestKnowledgeDocumentService, RetrieveKnowledgeChunksService],
})
export class KnowledgeBaseModule {}
