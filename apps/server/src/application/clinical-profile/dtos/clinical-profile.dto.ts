import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {ClinicalProfile} from '../../../domain/clinical-profile/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'ClinicalProfile'})
export class ClinicalProfileDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The patient ID'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'The professional ID'})
    professionalId: string;

    @ApiProperty({nullable: true, description: 'Known allergies'})
    allergies: string | null;

    @ApiProperty({nullable: true, description: 'Chronic conditions'})
    chronicConditions: string | null;

    @ApiProperty({nullable: true, description: 'Current medications'})
    currentMedications: string | null;

    @ApiProperty({nullable: true, description: 'Surgical history'})
    surgicalHistory: string | null;

    @ApiProperty({nullable: true, description: 'Family history'})
    familyHistory: string | null;

    @ApiProperty({nullable: true, description: 'Social history'})
    socialHistory: string | null;

    @ApiProperty({nullable: true, description: 'General notes'})
    generalNotes: string | null;

    constructor(profile: ClinicalProfile) {
        super(profile);
        this.patientId = profile.patientId.toString();
        this.professionalId = profile.professionalId.toString();
        this.allergies = profile.allergies;
        this.chronicConditions = profile.chronicConditions;
        this.currentMedications = profile.currentMedications;
        this.surgicalHistory = profile.surgicalHistory;
        this.familyHistory = profile.familyHistory;
        this.socialHistory = profile.socialHistory;
        this.generalNotes = profile.generalNotes;
    }
}
