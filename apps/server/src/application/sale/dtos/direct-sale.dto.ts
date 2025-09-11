import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {DirectSale} from '../../../domain/sale/entities';
import {SaleDto} from './sale.dto';

@ApiSchema({name: 'DirectSale'})
export class DirectSaleDto extends SaleDto {
    @ApiProperty({
        description: 'The person who made the purchase',
        format: 'uuid',
    })
    buyerId: string | null;

    constructor(directSale: DirectSale) {
        super(directSale);
        this.buyerId = directSale.buyerId?.toString() ?? null;
    }
}
