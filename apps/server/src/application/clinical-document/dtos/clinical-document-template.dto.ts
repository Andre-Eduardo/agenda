import {ApiProperty, ApiPropertyOptional, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '../../@shared/dto';
import type {ClinicalDocumentTemplate} from '../../../domain/clinical-document/entities';
import {ClinicalDocumentType} from '../../../domain/clinical-document/entities';

@ApiSchema({name: 'ClinicalDocumentTemplate'})
export class ClinicalDocumentTemplateDto extends EntityDto {
    @ApiPropertyOptional({format: 'uuid', nullable: true})
    clinicId: string | null;

    @ApiProperty({enum: ClinicalDocumentType})
    type: ClinicalDocumentType;

    @ApiProperty()
    isDefault: boolean;

    @ApiProperty()
    name: string;

    @ApiProperty()
    layoutJson: unknown;

    constructor(template: ClinicalDocumentTemplate) {
        super(template);
        this.clinicId = template.clinicId?.toString() ?? null;
        this.type = template.type;
        this.isDefault = template.isDefault;
        this.name = template.name;
        this.layoutJson = template.layoutJson;
    }
}
