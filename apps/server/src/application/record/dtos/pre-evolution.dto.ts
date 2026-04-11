import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {
    EvolutionTemplateType,
    AttendanceType,
    ClinicalStatusTag,
    ConductTag,
    RecordSource,
} from '../../../domain/record/entities';

@ApiSchema({name: 'PreEvolutionField'})
export class PreEvolutionFieldDto {
    @ApiProperty({description: 'The key of the field from the record model'})
    fieldKey: string;

    @ApiProperty({nullable: true, description: 'Raw value extracted by OCR'})
    rawValue: string | null;

    @ApiProperty({nullable: true, description: 'Structured value processed by AI'})
    structuredValue: any | null;

    @ApiProperty({description: 'AI confidence score (0.0 to 1.0)'})
    confidence: number;

    @ApiProperty({description: 'Whether this specific field requires human review'})
    needsReview: boolean;

    @ApiProperty({nullable: true, description: 'Value after human correction'})
    correctedValue: any | null;
}

export enum PreEvolutionStatus {
    DRAFT = 'DRAFT',
    PENDING_REVIEW = 'PENDING_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    FAILED = 'FAILED',
}

export enum PreEvolutionSourceType {
    OCR_IMPORTED = 'OCR_IMPORTED',
    AI_STRUCTURED = 'AI_STRUCTURED',
}

@ApiSchema({name: 'PreEvolution'})
export class PreEvolutionDto {
    @ApiProperty({enum: EvolutionTemplateType, nullable: true, description: 'Suggested template type'})
    templateType: EvolutionTemplateType | null;

    @ApiProperty({nullable: true, description: 'Suggested evolution title'})
    title: string | null;

    @ApiProperty({enum: AttendanceType, description: 'Suggested attendance type'})
    attendanceType: AttendanceType;

    @ApiProperty({enum: ClinicalStatusTag, nullable: true, description: 'Suggested clinical status'})
    clinicalStatus: ClinicalStatusTag | null;

    @ApiProperty({enum: ConductTag, isArray: true, description: 'Suggested conduct tags'})
    conductTags: ConductTag[];

    @ApiProperty({nullable: true, description: 'Suggested SOAP Subjective'})
    subjective: string | null;

    @ApiProperty({nullable: true, description: 'Suggested SOAP Objective'})
    objective: string | null;

    @ApiProperty({nullable: true, description: 'Suggested SOAP/DAP Assessment'})
    assessment: string | null;

    @ApiProperty({nullable: true, description: 'Suggested SOAP/DAP Plan'})
    plan: string | null;

    @ApiProperty({nullable: true, description: 'Suggested free notes'})
    freeNotes: string | null;

    @ApiProperty({format: 'date-time', nullable: true, description: 'Suggested event date'})
    eventDate: string | null;

    // Metadata & Flow
    @ApiProperty({description: 'Overall AI confidence score'})
    confidence: number;

    @ApiProperty({description: 'Whether the entire pre-evolution needs review'})
    reviewRequired: boolean;

    @ApiProperty({enum: PreEvolutionStatus, description: 'Current status of the pre-evolution'})
    status: PreEvolutionStatus;

    @ApiProperty({enum: PreEvolutionSourceType, description: 'Origin of the pre-evolution data'})
    sourceType: PreEvolutionSourceType;

    @ApiProperty({nullable: true, description: 'Original document type (e.g., MEDICAL_REPORT, PRESCRIPTION)'})
    documentType: string | null;

    @ApiProperty({description: 'Indicates if any part was already edited by a human'})
    wasHumanEdited: boolean;

    @ApiProperty({type: [PreEvolutionFieldDto], description: 'Detailed breakdown of extracted fields'})
    fields: PreEvolutionFieldDto[];
}
