import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {PatientForm} from '../../../domain/patient-form/entities';
import {FormResponseStatus} from '../../../domain/patient-form/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'PatientForm'})
export class PatientFormDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid'})
    professionalId: string;

    @ApiProperty({format: 'uuid'})
    templateId: string;

    @ApiProperty({format: 'uuid'})
    versionId: string;

    @ApiProperty({enum: FormResponseStatus})
    status: FormResponseStatus;

    @ApiProperty({description: 'Form answers JSON'})
    responseJson: unknown;

    @ApiProperty({nullable: true, description: 'Computed scores and classifications'})
    computedJson: unknown | null;

    @ApiProperty({format: 'date-time'})
    appliedAt: string;

    @ApiProperty({format: 'date-time', nullable: true})
    completedAt: string | null;

    constructor(form: PatientForm) {
        super(form);
        this.patientId = form.patientId.toString();
        this.professionalId = form.professionalId.toString();
        this.templateId = form.templateId.toString();
        this.versionId = form.versionId.toString();
        this.status = form.status;
        this.responseJson = form.responseJson;
        this.computedJson = form.computedJson;
        this.appliedAt = form.appliedAt.toISOString();
        this.completedAt = form.completedAt?.toISOString() ?? null;
    }
}
