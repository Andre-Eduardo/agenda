import {Injectable} from '@nestjs/common';
import {AiProviderRegistry} from '../../../domain/clinical-chat/ports/ai-provider-registry.port';
import type {Specialty} from '../../../domain/form-template/entities';
import type {KnowledgeChunk} from '../../../domain/knowledge-base/entities';
import {KnowledgeChunkRepository} from '../../../domain/knowledge-base/knowledge-chunk.repository';

export type RetrieveKnowledgeChunksInput = {
    query: string;
    topK?: number;
    specialty?: Specialty;
    category?: string;
    companyId?: string;
    minScore?: number;
};

export type RetrievedKnowledgeChunk = {
    id: string;
    content: string;
    category: string;
    specialty: Specialty | null;
    sourceFile: string | null;
    score: number;
};

export type RetrieveKnowledgeChunksOutput = {
    chunks: RetrievedKnowledgeChunk[];
    totalChunks: number;
};

@Injectable()
export class RetrieveKnowledgeChunksService {
    constructor(
        private readonly knowledgeChunkRepository: KnowledgeChunkRepository,
        private readonly aiProviderRegistry: AiProviderRegistry,
    ) {}

    async execute(input: RetrieveKnowledgeChunksInput): Promise<RetrieveKnowledgeChunksOutput> {
        const embeddingProvider = this.aiProviderRegistry.getEmbeddingProvider();
        const queryEmbedding = await embeddingProvider.generateEmbedding(input.query);

        const ranked = await this.knowledgeChunkRepository.searchSimilar({
            queryEmbedding,
            specialty: input.specialty,
            category: input.category,
            companyId: input.companyId,
            topK: input.topK ?? 5,
            minScore: input.minScore ?? 0.5,
        });

        const chunks = ranked.map(({chunk, score}) => this.toOutput(chunk, score));

        return {chunks, totalChunks: chunks.length};
    }

    private toOutput(chunk: KnowledgeChunk, score: number): RetrievedKnowledgeChunk {
        return {
            id: chunk.id.toString(),
            content: chunk.content,
            category: chunk.category,
            specialty: chunk.specialty,
            sourceFile: chunk.sourceFile,
            score,
        };
    }
}
