import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Patient} from '../../../domain/patient/entities';
import {Gender, PersonType} from '../../../domain/person/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Patient'})
export class PatientDto extends EntityDto {
    @ApiProperty({description: 'The patient name', example: 'John Doe'})
    name: string;

    @ApiProperty({description: 'The patient document ID', example: '123.456.789-00'})
    documentId: string;

    @ApiProperty({nullable: true, description: 'The patient phone', example: '(12) 94567-8912'})
    phone: string | null;

    @ApiProperty({enum: Gender, nullable: true, description: 'The patient gender'})
    gender: Gender | null;

    @ApiProperty({enum: PersonType, description: 'The person type'})
    personType: PersonType;

    @ApiProperty({format: 'uuid', description: 'The clinic this patient belongs to'})
    clinicId: string;

    @ApiProperty({format: 'date-time', nullable: true, description: 'The patient birth date'})
    birthDate: string | null;

    @ApiProperty({nullable: true, description: 'The patient email'})
    email: string | null;

    @ApiProperty({nullable: true, description: 'Emergency contact name'})
    emergencyContactName: string | null;

    @ApiProperty({nullable: true, description: 'Emergency contact phone'})
    emergencyContactPhone: string | null;

    constructor(patient: Patient) {
        super(patient);
        this.name = patient.name;
        this.documentId = patient.documentId.toString();
        this.phone = patient.phone?.toString() ?? null;
        this.gender = patient.gender;
        this.personType = patient.personType;
        this.clinicId = patient.clinicId.toString();
        this.birthDate = patient.birthDate?.toISOString() ?? null;
        this.email = patient.email;
        this.emergencyContactName = patient.emergencyContactName;
        this.emergencyContactPhone = patient.emergencyContactPhone;
    }
}
