import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {ContextChunkSourceType} from '../../../domain/clinical-chat/entities';
import {entityId} from '../../@shared/validation/schemas';
import {createZodDto} from '../../@shared/validation/dto';
import type {PatientContextSnapshot, PatientContextChunk} from '../../../domain/clinical-chat/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'PatientContextSnapshot'})
export class PatientContextSnapshotDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid', nullable: true})
    professionalId: string | null;

    @ApiProperty({description: 'Facts estruturados do paciente'})
    patientFacts: Record<string, unknown>;

    @ApiProperty({nullable: true})
    criticalContext: unknown[] | null;

    @ApiProperty({nullable: true, description: 'Timeline resumida de eventos clínicos'})
    timelineSummary: unknown[] | null;

    @ApiProperty()
    contentHash: string;

    @ApiProperty()
    status: string;

    @ApiProperty({format: 'date-time', nullable: true})
    builtAt: string | null;

    constructor(entity: PatientContextSnapshot) {
        super(entity);
        this.patientId = entity.patientId.toString();
        this.professionalId = entity.professionalId?.toString() ?? null;
        this.patientFacts = entity.patientFacts as Record<string, unknown>;
        this.criticalContext = entity.criticalContext as unknown[];
        this.timelineSummary = entity.timelineSummary as unknown[];
        this.contentHash = entity.contentHash;
        this.status = entity.status;
        this.builtAt = entity.builtAt?.toISOString() ?? null;
    }
}

@ApiSchema({name: 'PatientContextChunk'})
export class PatientContextChunkDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({enum: ContextChunkSourceType})
    sourceType: ContextChunkSourceType;

    @ApiProperty({format: 'uuid'})
    sourceId: string;

    @ApiProperty()
    content: string;

    @ApiProperty({nullable: true})
    metadata: Record<string, unknown> | null;

    @ApiProperty()
    chunkIndex: number;

    @ApiProperty()
    contentHash: string;

    @ApiProperty({nullable: true, description: 'Score de relevância (0–1). 1.0 quando sem embedding ativo.'})
    score?: number;

    constructor(entity: PatientContextChunk, score?: number) {
        super(entity);
        this.patientId = entity.patientId.toString();
        this.sourceType = entity.sourceType;
        this.sourceId = entity.sourceId;
        this.content = entity.content;
        this.metadata = entity.metadata as Record<string, unknown> | null;
        this.chunkIndex = entity.chunkIndex;
        this.contentHash = entity.contentHash;
        this.score = score;
    }
}

// Input schemas

export const rebuildContextSchema = z.object({
    patientId: entityId(PatientId),
    professionalId: entityId(ProfessionalId).optional(),
    reindex: z.boolean().default(true),
});

export class RebuildContextDto extends createZodDto(rebuildContextSchema) {}

export const retrieveChunksSchema = z.object({
    patientId: entityId(PatientId),
    query: z.string().min(1).max(1000).openapi({example: 'Qual o histórico de ansiedade deste paciente?'}),
    sourceTypes: z.array(z.nativeEnum(ContextChunkSourceType)).optional(),
    topK: z.coerce.number().int().positive().max(50).default(10),
    minScore: z.coerce.number().min(0).max(1).default(0),
});

export class RetrieveChunksDto extends createZodDto(retrieveChunksSchema) {}
