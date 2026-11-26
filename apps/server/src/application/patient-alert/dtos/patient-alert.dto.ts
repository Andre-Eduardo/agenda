import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import type {PatientAlert} from '@domain/patient-alert/entities';
import {AlertSeverity} from '@domain/patient-alert/entities';

@ApiSchema({name: 'PatientAlert'})
export class PatientAlertDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The clinic this alert belongs to'})
    clinicId: string;

    @ApiProperty({format: 'uuid', description: 'The patient ID'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'ClinicMember who created the alert'})
    createdByMemberId: string;

    @ApiProperty({description: 'Alert title'})
    title: string;

    @ApiProperty({type: 'string', nullable: true, description: 'Alert description'})
    description: string | null;

    @ApiProperty({enum: AlertSeverity, description: 'Alert severity'})
    severity: AlertSeverity;

    @ApiProperty({description: 'Whether the alert is active'})
    isActive: boolean;

    constructor(alert: PatientAlert) {
        super(alert);
        this.clinicId = alert.clinicId.toString();
        this.patientId = alert.patientId.toString();
        this.createdByMemberId = alert.createdByMemberId.toString();
        this.title = alert.title;
        this.description = alert.description;
        this.severity = alert.severity;
        this.isActive = alert.isActive;
    }
}

@ApiSchema({name: 'PatientAlertPage'})
export class PatientAlertPageDto {
    @ApiProperty()
    totalCount!: number;

    @ApiProperty({type: [PatientAlertDto]})
    data!: PatientAlertDto[];
}
