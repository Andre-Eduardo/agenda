import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Stock, StockType} from '../../../domain/stock/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Stock'})
export class StockDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the stock',
        example: 'Hallway stock',
    })
    name: string | null;

    @ApiProperty({
        description: 'The ID of the room the stock belongs to',
        format: 'uuid',
    })
    roomId: string | null;

    @ApiProperty({
        description: 'The type of the stock',
        enum: StockType,
        enumName: 'StockType',
    })
    type: StockType;

    @ApiProperty({
        description: 'The ID of the parent stock',
        format: 'uuid',
    })
    parentId: string | null;

    constructor(stock: Stock) {
        super(stock);
        this.name = stock.name;
        this.roomId = stock.roomId?.toString() ?? null;
        this.type = stock.type;
        this.parentId = stock.parentId?.toString() ?? null;
    }
}
