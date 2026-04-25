import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {PatientId} from '../../patient/entities';

export enum ContextChunkSourceType {
    RECORD = 'RECORD',
    PATIENT_FORM = 'PATIENT_FORM',
    CLINICAL_PROFILE = 'CLINICAL_PROFILE',
    PATIENT_ALERT = 'PATIENT_ALERT',
    IMPORTED_DOCUMENT = 'IMPORTED_DOCUMENT',
}

export type ChunkMetadata = {
    /** Tipo do template do record (SOAP, DAP) ou do formulário */
    templateType?: string | null;
    /** Título do record ou formulário */
    title?: string | null;
    /** Data do evento clínico */
    eventDate?: string | null;
    /** Tipo de atendimento */
    attendanceType?: string | null;
    /** Status clínico */
    clinicalStatus?: string | null;
    /** Especialidade do formulário */
    specialty?: string | null;
    /** Seção SOAP de origem (subjective, objective, assessment, plan) */
    soapSection?: string | null;
};

export type ContextChunkProps = EntityProps<PatientContextChunk>;
export type CreateContextChunk = CreateEntity<PatientContextChunk>;

/**
 * Chunk indexável para RAG — pedaço de conteúdo clínico normalizado e pronto para vetorização.
 *
 * EMBEDDING: O campo `embedding` é o ponto de integração com pgvector.
 * Na próxima etapa, ao plugar um provider de embeddings (ex: OpenAI, Voyage, etc.):
 * 1. Gerar o vetor chamando o provider com o campo `content`
 * 2. Armazenar o vetor no campo `embedding`
 * 3. Após ativar pgvector, migrar o campo para Unsupported("vector(1536)")
 * 4. Usar busca por similaridade coseno via `@@index([embedding], type: Hnsw)`
 */
export class PatientContextChunk extends AggregateRoot<PatientContextChunkId> {
    clinicId: ClinicId;
    patientId: PatientId;
    /** Tipo da fonte de onde o chunk foi extraído */
    sourceType: ContextChunkSourceType;
    /** ID da entidade de origem (Record.id, PatientForm.id, etc.) */
    sourceId: string;
    /** Conteúdo textual normalizado do chunk */
    content: string;
    /** Metadados estruturados para filtros e exibição de resultados */
    metadata: ChunkMetadata | null;
    /** Índice do chunk dentro da mesma fonte (para fontes com múltiplos chunks) */
    chunkIndex: number;
    /**
     * Embedding vetorial do conteúdo.
     * Placeholder — será substituído por vetor real quando pgvector for ativado.
     * Formato esperado: number[] com dimensão do modelo de embeddings escolhido.
     */
    embedding: number[] | null;
    /** Hash SHA-256 do content — detecta mudanças para re-indexação */
    contentHash: string;

    constructor(props: AllEntityProps<PatientContextChunk>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.sourceType = props.sourceType;
        this.sourceId = props.sourceId;
        this.content = props.content;
        this.metadata = props.metadata ?? null;
        this.chunkIndex = props.chunkIndex ?? 0;
        this.embedding = props.embedding ?? null;
        this.contentHash = props.contentHash;
    }

    static create(props: CreateContextChunk): PatientContextChunk {
        const now = new Date();

        return new PatientContextChunk({
            ...props,
            id: PatientContextChunkId.generate(),
            clinicId: props.clinicId!,
            patientId: props.patientId!,
            sourceType: props.sourceType!,
            sourceId: props.sourceId!,
            content: props.content!,
            metadata: props.metadata ?? null,
            chunkIndex: props.chunkIndex ?? 0,
            embedding: props.embedding ?? null,
            contentHash: props.contentHash!,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    /** Atualiza o embedding após vetorização pelo provider de IA. */
    setEmbedding(embedding: number[]): void {
        this.embedding = embedding;
        this.update();
    }

    toJSON(): EntityJson<PatientContextChunk> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            sourceType: this.sourceType,
            sourceId: this.sourceId,
            content: this.content,
            metadata: this.metadata,
            chunkIndex: this.chunkIndex,
            embedding: this.embedding,
            contentHash: this.contentHash,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

export class PatientContextChunkId extends EntityId<'PatientContextChunkId'> {
    static from(value: string): PatientContextChunkId {
        return new PatientContextChunkId(value);
    }

    static generate(): PatientContextChunkId {
        return new PatientContextChunkId();
    }
}
