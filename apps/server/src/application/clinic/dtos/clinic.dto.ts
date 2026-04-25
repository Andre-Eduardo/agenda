import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Clinic} from '../../../domain/clinic/entities';
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

    constructor(clinic: Clinic) {
        super(clinic);
        this.name = clinic.name;
        this.documentId = clinic.documentId?.toString() ?? null;
        this.phone = clinic.phone?.toString() ?? null;
        this.email = clinic.email?.toString() ?? null;
        this.isPersonalClinic = clinic.isPersonalClinic;
    }
}
