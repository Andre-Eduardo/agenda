import {ApiProperty} from '@nestjs/swagger';
import type {ProductCategory} from '../../../domain/product-category/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class ProductCategoryDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the product category',
        example: 'Drinks',
    })
    name: string;

    constructor(productCategory: ProductCategory) {
        super(productCategory);
        this.name = productCategory.name;
    }
}
