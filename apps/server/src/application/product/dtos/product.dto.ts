import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Product} from '../../../domain/product/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Product'})
export class ProductDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The category ID of the product',
        format: 'uuid',
    })
    categoryId: string;

    @ApiProperty({
        description: 'The name of the product',
        example: 'Whiskey',
    })
    name: string;

    @ApiProperty({
        description: 'The code of the product',
        example: 141,
    })
    code: number;

    @ApiProperty({
        description: 'The price of the product',
        example: 100.0,
    })
    price: number;

    constructor(product: Product) {
        super(product);
        this.companyId = product.companyId.toString();
        this.categoryId = product.categoryId.toString();
        this.name = product.name;
        this.code = product.code;
        this.price = product.price;
    }
}
