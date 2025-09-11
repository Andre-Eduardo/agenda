import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Cashier} from '../../../domain/cashier/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Cashier'})
export class CashierDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The ID of the responsible user for the cashier',
        format: 'uuid',
    })
    userId: string;

    @ApiProperty({
        description: 'The date and time the cashier was closed',
        format: 'date-time',
    })
    closedAt: Date | null;

    constructor(cashier: Cashier) {
        super(cashier);
        this.companyId = cashier.companyId.toString();
        this.userId = cashier.userId.toString();
        this.closedAt = cashier.closedAt;
    }
}
