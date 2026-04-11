import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {FormTemplate} from '../../../domain/form-template/entities';
import {Specialty} from '../../../domain/form-template/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'FormTemplate'})
export class FormTemplateDto extends EntityDto {
    @ApiProperty({description: 'Unique stable code for the template'})
    code: string;

    @ApiProperty({description: 'Template name'})
    name: string;

    @ApiProperty({nullable: true, description: 'Optional description'})
    description: string | null;

    @ApiProperty({enum: Specialty, description: 'Target specialty'})
    specialty: Specialty;

    @ApiProperty({description: 'Whether this is a public system template'})
    isPublic: boolean;

    @ApiProperty({format: 'uuid', nullable: true, description: 'Owner professional ID (null for public templates)'})
    professionalId: string | null;

    constructor(template: FormTemplate) {
        super(template);
        this.code = template.code;
        this.name = template.name;
        this.description = template.description;
        this.specialty = template.specialty;
        this.isPublic = template.isPublic;
        this.professionalId = template.professionalId?.toString() ?? null;
    }
}
