import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import {AiSpecialtyGroup} from '@domain/form-template/entities';
import type {Professional} from '@domain/professional/entities';

@ApiSchema({name: 'Professional'})
export class ProfessionalDto extends EntityDto {
    @ApiProperty({
        format: 'uuid',
        description: 'The clinic member that owns this professional record',
    })
    clinicMemberId: string;

    @ApiProperty({nullable: true, description: 'Professional registration number (CRM, CRP, etc.)'})
    registrationNumber: string | null;

    @ApiProperty({nullable: true, description: 'Free-form specialty', example: 'Cardiology'})
    specialty: string | null;

    @ApiProperty({
        enum: AiSpecialtyGroup,
        nullable: true,
        description: 'Normalized specialty group',
    })
    specialtyNormalized: AiSpecialtyGroup | null;

    constructor(professional: Professional) {
        super(professional);
        this.clinicMemberId = professional.clinicMemberId.toString();
        this.registrationNumber = professional.registrationNumber;
        this.specialty = professional.specialty;
        this.specialtyNormalized = professional.specialtyNormalized;
    }
}
