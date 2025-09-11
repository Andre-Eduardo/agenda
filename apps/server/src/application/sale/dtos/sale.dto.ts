import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Sale} from '../../../domain/sale/entities';
import {CompanyEntityDto} from '../../@shared/dto';
import {SaleItemDto} from './sale-item.dto';

@ApiSchema({name: 'Sale'})
export class SaleDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The user responsible for making the sale',
        format: 'uuid',
    })
    sellerId: string;

    @ApiProperty({
        description: 'The items that were sold',
    })
    items: SaleItemDto[];

    @ApiProperty({
        description: 'Any additional notes about the guest or sale',
        example: 'The guest is in a hurry',
    })
    note: string | null;

    constructor(sale: Sale) {
        super(sale);
        this.sellerId = sale.sellerId.toString();
        this.items = sale.items.map((item) => new SaleItemDto(item));
        this.note = sale.note ?? null;
    }
}
