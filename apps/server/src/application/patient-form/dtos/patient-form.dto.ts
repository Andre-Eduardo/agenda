import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {PatientForm} from '../../../domain/patient-form/entities';
import {FormResponseStatus} from '../../../domain/patient-form/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'PatientForm'})
export class PatientFormDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({format: 'uuid'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'ClinicMember who applied/filled the form'})
    createdByMemberId: string;

    @ApiProperty({format: 'uuid', nullable: true, description: 'Professional clinically responsible'})
    responsibleProfessionalId: string | null;

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
        this.clinicId = form.clinicId.toString();
        this.patientId = form.patientId.toString();
        this.createdByMemberId = form.createdByMemberId.toString();
        this.responsibleProfessionalId = form.responsibleProfessionalId?.toString() ?? null;
        this.templateId = form.templateId.toString();
        this.versionId = form.versionId.toString();
        this.status = form.status;
        this.responseJson = form.responseJson;
        this.computedJson = form.computedJson;
        this.appliedAt = form.appliedAt.toISOString();
        this.completedAt = form.completedAt?.toISOString() ?? null;
    }
}
