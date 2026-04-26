import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Clinic} from '../../../domain/clinic/entities';
import {AiSpecialtyGroup} from '../../../domain/form-template/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Clinic'})
export class ClinicDto extends EntityDto {
    @ApiProperty({description: 'Clinic name', example: 'Clínica Saúde Total'})
    name: string;

    @ApiProperty({nullable: true, description: 'CNPJ/CPF', example: '12.345.678/0001-90'})
    documentId: string | null;

    @ApiProperty({nullable: true, description: 'Phone'})
    phone: string | null;

    @ApiProperty({nullable: true, description: 'Email'})
    email: string | null;

    @ApiProperty({description: 'true = autônomo (sem equipe). Front esconde menus de membros.'})
    isPersonalClinic: boolean;

    @ApiProperty({nullable: true, description: 'Street name'})
    street: string | null;

    @ApiProperty({nullable: true, description: 'Street number'})
    number: string | null;

    @ApiProperty({nullable: true, description: 'Address complement'})
    complement: string | null;

    @ApiProperty({nullable: true, description: 'Neighborhood'})
    neighborhood: string | null;

    @ApiProperty({nullable: true, description: 'City'})
    city: string | null;

    @ApiProperty({nullable: true, description: 'State'})
    state: string | null;

    @ApiProperty({nullable: true, description: 'Zip code'})
    zipCode: string | null;

    @ApiProperty({nullable: true, description: 'Country code', example: 'BR'})
    country: string | null;

    @ApiProperty({nullable: true, description: 'Logo URL'})
    logoUrl: string | null;

    @ApiProperty({enum: AiSpecialtyGroup, isArray: true, description: 'Specialties offered by the clinic'})
    clinicSpecialties: AiSpecialtyGroup[];

    constructor(clinic: Clinic) {
        super(clinic);
        this.name = clinic.name;
        this.documentId = clinic.documentId?.toString() ?? null;
        this.phone = clinic.phone?.toString() ?? null;
        this.email = clinic.email?.toString() ?? null;
        this.isPersonalClinic = clinic.isPersonalClinic;
        this.street = clinic.street;
        this.number = clinic.number;
        this.complement = clinic.complement;
        this.neighborhood = clinic.neighborhood;
        this.city = clinic.city;
        this.state = clinic.state;
        this.zipCode = clinic.zipCode;
        this.country = clinic.country;
        this.logoUrl = clinic.logoUrl;
        this.clinicSpecialties = clinic.clinicSpecialties;
    }
}
