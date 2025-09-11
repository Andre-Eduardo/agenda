import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Company} from '../../../domain/company/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Company'})
export class CompanyDto extends EntityDto {
    @ApiProperty({
        description: 'The name of the company',
        example: 'Ecxus High-Technology',
    })
    name: string;

    constructor(company: Company) {
        super(company);
        this.name = company.name;
    }
}
