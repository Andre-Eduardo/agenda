import {ApiProperty} from '@nestjs/swagger';
import type {ServiceCategory} from '../../../domain/service-category/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class ServiceCategoryDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the service category',
        example: 'Maintenance',
    })
    name: string;

    constructor(serviceCategory: ServiceCategory) {
        super(serviceCategory);
        this.name = serviceCategory.name;
    }
}
