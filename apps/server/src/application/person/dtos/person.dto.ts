import {ApiProperty} from '@nestjs/swagger';
import {Gender, Person, PersonProfile, PersonType} from '../../../domain/person/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class PersonDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the person',
        example: 'John doe',
    })
    name: string;

    @ApiProperty({
        description: 'The company name of the person',
        example: 'ACME',
    })
    companyName: string | null;

    @ApiProperty({
        description: 'The document ID of the person',
        example: '123.456.789-00',
    })
    documentId: string;

    @ApiProperty({
        description: 'The person type of the person',
        enum: PersonType,
        enumName: 'PersonType',
    })
    personType: PersonType;

    @ApiProperty({
        description: 'The profiles of the person',
        example: [PersonProfile.CUSTOMER, PersonProfile.EMPLOYEE],
        isArray: true,
        enum: PersonProfile,
        enumName: 'PersonProfile',
    })
    profiles: PersonProfile[];

    @ApiProperty({
        description: 'The phone of the person',
        example: '12345678900',
    })
    phone: string | null;

    @ApiProperty({
        description: 'The gender of the person',
        enum: Gender,
        enumName: 'Gender',
    })
    gender: Gender | null;

    constructor(person: Person) {
        super(person);
        this.name = person.name;
        this.companyName = person.companyName ?? null;
        this.documentId = person.documentId.toString();
        this.personType = person.personType;
        this.profiles = [...person.profiles];
        this.phone = person.phone?.toString() ?? null;
        this.gender = person.gender ?? null;
    }
}
