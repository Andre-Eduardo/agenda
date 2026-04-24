import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum, toEnumOrNull} from '../../domain/@shared/utils';
import {Specialty} from '../../domain/form-template/entities';
import {KnowledgeChunk, KnowledgeChunkId, type KnowledgeChunkMetadata} from '../../domain/knowledge-base/entities';
import {MapperWithoutDto} from './mapper';

export type KnowledgeChunkModel = PrismaClient.KnowledgeChunk;

export type KnowledgeChunkRawRow = {
    id: string;
    company_id: string | null;
    specialty: string | null;
    category: string;
    content: string;
    metadata: unknown;
    source_file: string | null;
    source_page: number | null;
    content_hash: string;
    created_at: Date;
    updated_at: Date;
    score?: number;
};

@Injectable()
export class KnowledgeChunkMapper extends MapperWithoutDto<KnowledgeChunk, KnowledgeChunkModel> {
    toDomain(model: KnowledgeChunkModel): KnowledgeChunk {
        return new KnowledgeChunk({
            id: KnowledgeChunkId.from(model.id),
            companyId: model.companyId,
            specialty: toEnumOrNull(Specialty, model.specialty),
            category: model.category,
            content: model.content,
            metadata: model.metadata as KnowledgeChunkMetadata | null,
            sourceFile: model.sourceFile,
            sourcePage: model.sourcePage,
            embedding: null,
            contentHash: model.contentHash,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toDomainFromRaw(row: KnowledgeChunkRawRow): KnowledgeChunk {
        return new KnowledgeChunk({
            id: KnowledgeChunkId.from(row.id),
            companyId: row.company_id,
            specialty: toEnumOrNull(Specialty, row.specialty),
            category: row.category,
            content: row.content,
            metadata: row.metadata as KnowledgeChunkMetadata | null,
            sourceFile: row.source_file,
            sourcePage: row.source_page !== null ? Number(row.source_page) : null,
            embedding: null,
            contentHash: row.content_hash,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: null,
        });
    }

    toPersistence(entity: KnowledgeChunk): Omit<KnowledgeChunkModel, 'embedding'> {
        return {
            id: entity.id.toString(),
            companyId: entity.companyId,
            specialty: entity.specialty
                ? toEnum(PrismaClient.Specialty, entity.specialty)
                : null,
            category: entity.category,
            content: entity.content,
            metadata: entity.metadata as PrismaClient.Prisma.JsonValue,
            sourceFile: entity.sourceFile,
            sourcePage: entity.sourcePage,
            contentHash: entity.contentHash,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
