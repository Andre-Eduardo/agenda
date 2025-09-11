import {ApiProperty} from '@nestjs/swagger';
import type {Service} from '../../../domain/service/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class ServiceDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The category ID of the service',
        format: 'uuid',
    })
    categoryId: string;

    @ApiProperty({
        description: 'The name of the service',
        format: 'string',
    })
    name: string;

    @ApiProperty({
        description: 'The code of the service',
        format: 'number',
    })
    code: number;

    @ApiProperty({
        description: 'The price of the service',
        format: 'number',
    })
    price: number;

    constructor(service: Service) {
        super(service);
        this.companyId = service.companyId.toString();
        this.categoryId = service.categoryId.toString();
        this.name = service.name;
        this.code = service.code;
        this.price = service.price;
    }
}
