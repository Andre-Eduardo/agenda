import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {SaleItem} from '../../../domain/sale/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'SaleItem'})
export class SaleItemDto extends EntityDto {
    @ApiProperty({
        description: 'The sale ID',
        format: 'uuid',
    })
    saleId: string;

    @ApiProperty({
        description: 'The product ID',
        format: 'uuid',
    })
    productId: string;

    @ApiProperty({
        description: 'The quantity of product that was sold',
        example: 2,
    })
    quantity: number;

    @ApiProperty({
        description: 'The price of the product in this sale',
        example: 12.3,
    })
    price: number;

    @ApiProperty({
        description: 'Any additional notes about the product',
        example: 'Remove onion',
    })
    note: string | null;

    @ApiProperty({
        description: 'The date and time the purchase was canceled',
        format: 'date-time',
    })
    canceledAt: string | null;

    @ApiProperty({
        description: 'The user who canceled the purchase',
        format: 'uuid',
    })
    canceledBy: string | null;

    @ApiProperty({
        description: 'The reason for canceling the purchase',
    })
    canceledReason: string | null;

    constructor(saleItem: SaleItem) {
        super(saleItem);
        this.saleId = saleItem.saleId.toString();
        this.productId = saleItem.productId.toString();
        this.quantity = saleItem.quantity;
        this.price = saleItem.price;
        this.note = saleItem.note?.toString() ?? null;
        this.canceledAt = saleItem.canceledAt?.toString() ?? null;
        this.canceledBy = saleItem.canceledBy?.toString() ?? null;
        this.canceledReason = saleItem.canceledReason?.toString() ?? null;
    }
}
