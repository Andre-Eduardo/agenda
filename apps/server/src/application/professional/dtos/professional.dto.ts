import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Professional} from '../../../domain/professional/entities';
import {Gender, PersonProfile, PersonType} from '../../../domain/person/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Professional'})
export class ProfessionalDto extends EntityDto {
    @ApiProperty({description: 'The professional name', example: 'Dr. Jane Smith'})
    name: string;

    @ApiProperty({description: 'The professional document ID', example: '123.456.789-00'})
    documentId: string;

    @ApiProperty({nullable: true, description: 'The professional phone', example: '(12) 94567-8912'})
    phone: string | null;

    @ApiProperty({enum: Gender, nullable: true, description: 'The professional gender'})
    gender: Gender | null;

    @ApiProperty({enum: PersonType, description: 'The person type'})
    personType: PersonType;

    @ApiProperty({enum: PersonProfile, isArray: true, description: 'The professional profiles'})
    profiles: PersonProfile[];

    @ApiProperty({description: 'The professional specialty', example: 'Cardiology'})
    specialty: string;

    @ApiProperty({format: 'uuid', description: 'The professional config ID'})
    configId: string;

    @ApiProperty({format: 'uuid', nullable: true, description: 'The associated user ID'})
    userId: string | null;

    constructor(professional: Professional) {
        super(professional);
        this.name = professional.name;
        this.documentId = professional.documentId.toString();
        this.phone = professional.phone?.toString() ?? null;
        this.gender = professional.gender;
        this.personType = professional.personType;
        this.profiles = Array.from(professional.profiles);
        this.specialty = professional.specialty;
        this.configId = professional.configId.toString();
        this.userId = professional.userId?.toString() ?? null;
    }
}
