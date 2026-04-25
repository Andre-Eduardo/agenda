import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {Specialty} from '../../form-template/entities';

export type KnowledgeChunkMetadata = {
    title?: string | null;
    section?: string | null;
    tags?: string[] | null;
    originalFormat?: string | null;
};

export type KnowledgeChunkProps = EntityProps<KnowledgeChunk>;
export type CreateKnowledgeChunk = CreateEntity<KnowledgeChunk>;

export class KnowledgeChunk extends AggregateRoot<KnowledgeChunkId> {
    /** null = chunk global; preenchido = chunk scoped para uma empresa */
    companyId: string | null;
    specialty: Specialty | null;
    /** "protocolo" | "cid" | "faq" | "manual" | "diretriz" */
    category: string;
    content: string;
    metadata: KnowledgeChunkMetadata | null;
    sourceFile: string | null;
    sourcePage: number | null;
    embedding: number[] | null;
    contentHash: string;

    constructor(props: AllEntityProps<KnowledgeChunk>) {
        super(props);
        this.companyId = props.companyId ?? null;
        this.specialty = props.specialty ?? null;
        this.category = props.category;
        this.content = props.content;
        this.metadata = props.metadata ?? null;
        this.sourceFile = props.sourceFile ?? null;
        this.sourcePage = props.sourcePage ?? null;
        this.embedding = props.embedding ?? null;
        this.contentHash = props.contentHash;
    }

    static create(props: CreateKnowledgeChunk): KnowledgeChunk {
        const now = new Date();

        return new KnowledgeChunk({
            ...props,
            id: KnowledgeChunkId.generate(),
            companyId: props.companyId ?? null,
            specialty: props.specialty ?? null,
            category: props.category!,
            content: props.content!,
            metadata: props.metadata ?? null,
            sourceFile: props.sourceFile ?? null,
            sourcePage: props.sourcePage ?? null,
            embedding: props.embedding ?? null,
            contentHash: props.contentHash!,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    setEmbedding(embedding: number[]): void {
        this.embedding = embedding;
        this.update();
    }

    toJSON(): EntityJson<KnowledgeChunk> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId,
            specialty: this.specialty,
            category: this.category,
            content: this.content,
            metadata: this.metadata,
            sourceFile: this.sourceFile,
            sourcePage: this.sourcePage,
            embedding: this.embedding,
            contentHash: this.contentHash,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

export class KnowledgeChunkId extends EntityId<'KnowledgeChunkId'> {
    static from(value: string): KnowledgeChunkId {
        return new KnowledgeChunkId(value);
    }

    static generate(): KnowledgeChunkId {
        return new KnowledgeChunkId();
    }
}
