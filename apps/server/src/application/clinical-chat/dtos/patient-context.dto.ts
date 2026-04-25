import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {ClinicMemberId} from '../../../domain/clinic-member/entities';
import {ContextChunkSourceType} from '../../../domain/clinical-chat/entities';
import {PatientId} from '../../../domain/patient/entities';
import {entityId} from '../../@shared/validation/schemas';
import {createZodDto} from '../../@shared/validation/dto';
import type {PatientContextSnapshot, PatientContextChunk} from '../../../domain/clinical-chat/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'PatientContextSnapshot'})
export class PatientContextSnapshotDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid', nullable: true, description: 'Member-specific snapshot (null = generic)'})
    memberId: string | null;

    @ApiProperty({description: 'Structured patient facts'})
    patientFacts: Record<string, unknown>;

    @ApiProperty({nullable: true})
    criticalContext: unknown[] | null;

    @ApiProperty({nullable: true, description: 'Summarized clinical timeline'})
    timelineSummary: unknown[] | null;

    @ApiProperty()
    contentHash: string;

    @ApiProperty()
    status: string;

    @ApiProperty({format: 'date-time', nullable: true})
    builtAt: string | null;

    constructor(entity: PatientContextSnapshot) {
        super(entity);
        this.clinicId = entity.clinicId.toString();
        this.patientId = entity.patientId.toString();
        this.memberId = entity.memberId?.toString() ?? null;
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
    clinicId: string;

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

    @ApiProperty({nullable: true, description: 'Relevance score (0–1). 1.0 when no embedding available.'})
    score?: number;

    constructor(entity: PatientContextChunk, score?: number) {
        super(entity);
        this.clinicId = entity.clinicId.toString();
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
    /** Optional: build a member-scoped snapshot. Defaults to generic (null). */
    memberId: entityId(ClinicMemberId).optional(),
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
