import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {AttendanceType, ClinicalStatusTag, ConductTag, EvolutionTemplateType} from '../../../domain/record/entities/record.entity';
import {DraftEvolutionStatus} from '../../../domain/draft-evolution/entities/draft-evolution.entity';
import type {DraftEvolution} from '../../../domain/draft-evolution/entities/draft-evolution.entity';
import {EntityDto} from '../../@shared/dto';
import {ImportedDocumentId} from '../../../domain/record/entities/imported-document.entity';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

@ApiSchema({name: 'DraftEvolution'})
export class DraftEvolutionDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid'})
    createdByMemberId: string;

    @ApiProperty({format: 'uuid', nullable: true})
    importedDocumentId: string | null;

    @ApiProperty({enum: EvolutionTemplateType, nullable: true})
    templateType: EvolutionTemplateType | null;

    @ApiProperty({nullable: true})
    title: string | null;

    @ApiProperty({enum: AttendanceType, nullable: true})
    attendanceType: AttendanceType | null;

    @ApiProperty({enum: ClinicalStatusTag, nullable: true})
    clinicalStatus: ClinicalStatusTag | null;

    @ApiProperty({enum: ConductTag, isArray: true})
    conductTags: ConductTag[];

    @ApiProperty({nullable: true})
    subjective: string | null;

    @ApiProperty({nullable: true})
    objective: string | null;

    @ApiProperty({nullable: true})
    assessment: string | null;

    @ApiProperty({nullable: true})
    plan: string | null;

    @ApiProperty({nullable: true})
    freeNotes: string | null;

    @ApiProperty({format: 'date-time', nullable: true})
    eventDate: string | null;

    @ApiProperty({nullable: true, description: 'Overall AI confidence score (0.0-1.0)'})
    overallConfidence: number | null;

    @ApiProperty({enum: DraftEvolutionStatus})
    status: DraftEvolutionStatus;

    @ApiProperty({description: 'Whether the professional edited any field before approval'})
    wasHumanEdited: boolean;

    @ApiProperty({description: 'Whether a human review is required before approval'})
    reviewRequired: boolean;

    @ApiProperty({format: 'uuid', nullable: true})
    approvedByMemberId: string | null;

    @ApiProperty({format: 'date-time', nullable: true})
    approvedAt: string | null;

    @ApiProperty({format: 'uuid', nullable: true, description: 'ID of the Record created upon approval'})
    recordId: string | null;

    constructor(draft: DraftEvolution) {
        super(draft);
        this.clinicId = draft.clinicId.toString();
        this.patientId = draft.patientId.toString();
        this.createdByMemberId = draft.createdByMemberId.toString();
        this.importedDocumentId = draft.importedDocumentId?.toString() ?? null;
        this.templateType = draft.templateType;
        this.title = draft.title;
        this.attendanceType = draft.attendanceType;
        this.clinicalStatus = draft.clinicalStatus;
        this.conductTags = draft.conductTags;
        this.subjective = draft.subjective;
        this.objective = draft.objective;
        this.assessment = draft.assessment;
        this.plan = draft.plan;
        this.freeNotes = draft.freeNotes;
        this.eventDate = draft.eventDate?.toISOString() ?? null;
        this.overallConfidence = draft.overallConfidence;
        this.status = draft.status;
        this.wasHumanEdited = draft.wasHumanEdited;
        this.reviewRequired = draft.reviewRequired;
        this.approvedByMemberId = draft.approvedByMemberId?.toString() ?? null;
        this.approvedAt = draft.approvedAt?.toISOString() ?? null;
        this.recordId = draft.recordId?.toString() ?? null;
    }
}

export const getDraftSchema = z.object({
    id: entityId(ImportedDocumentId),
});

export class GetDraftDto extends createZodDto(getDraftSchema) {}

export const updateDraftBodySchema = z.object({
    templateType: z.nativeEnum(EvolutionTemplateType).optional(),
    title: z.string().max(255).nullish(),
    attendanceType: z.nativeEnum(AttendanceType).optional(),
    clinicalStatus: z.nativeEnum(ClinicalStatusTag).nullish(),
    conductTags: z.array(z.nativeEnum(ConductTag)).optional(),
    subjective: z.string().nullish(),
    objective: z.string().nullish(),
    assessment: z.string().nullish(),
    plan: z.string().nullish(),
    freeNotes: z.string().nullish(),
    eventDate: z.coerce.date().nullish(),
});

export class UpdateDraftBodyDto extends createZodDto(updateDraftBodySchema) {}
