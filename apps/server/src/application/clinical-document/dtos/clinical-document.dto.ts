import {ApiProperty, ApiPropertyOptional, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '../../@shared/dto';
import type {ClinicalDocument} from '../../../domain/clinical-document/entities';
import {ClinicalDocumentStatus, ClinicalDocumentType} from '../../../domain/clinical-document/entities';

@ApiSchema({name: 'ClinicalDocument'})
export class ClinicalDocumentDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid'})
    createdByMemberId: string;

    @ApiProperty({format: 'uuid'})
    responsibleProfessionalId: string;

    @ApiProperty({enum: ClinicalDocumentType})
    type: ClinicalDocumentType;

    @ApiPropertyOptional({format: 'uuid', nullable: true})
    templateId: string | null;

    @ApiProperty()
    contentJson: unknown;

    @ApiPropertyOptional({format: 'uuid', nullable: true})
    fileId: string | null;

    @ApiPropertyOptional({format: 'date-time', nullable: true})
    generatedAt: string | null;

    @ApiProperty({enum: ClinicalDocumentStatus})
    status: ClinicalDocumentStatus;

    @ApiPropertyOptional({format: 'uuid', nullable: true})
    appointmentId: string | null;

    @ApiPropertyOptional({format: 'uuid', nullable: true})
    recordId: string | null;

    constructor(document: ClinicalDocument) {
        super(document);
        this.clinicId = document.clinicId.toString();
        this.patientId = document.patientId.toString();
        this.createdByMemberId = document.createdByMemberId.toString();
        this.responsibleProfessionalId = document.responsibleProfessionalId.toString();
        this.type = document.type;
        this.templateId = document.templateId?.toString() ?? null;
        this.contentJson = document.contentJson;
        this.fileId = document.fileId;
        this.generatedAt = document.generatedAt?.toISOString() ?? null;
        this.status = document.status;
        this.appointmentId = document.appointmentId?.toString() ?? null;
        this.recordId = document.recordId;
    }
}
