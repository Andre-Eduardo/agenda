import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {Transaction, TransactionOriginType, TransactionType} from '../../../domain/transaction/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Transaction'})
export class TransactionDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The description of the transaction',
        example: 'The transaction.',
    })
    description: string | null;

    @ApiProperty({
        description: 'The ID of the entity that originated the transaction',
    })
    originId: string | null;

    @ApiProperty({
        description: 'The type of the entity that originated the transaction',
        enum: TransactionOriginType,
        enumName: 'TransactionOriginType',
    })
    originType: TransactionOriginType | null;

    @ApiProperty({
        description: 'The counterparty ID of the transaction',
        format: 'uuid',
    })
    counterpartyId: string | null;

    @ApiProperty({
        description: 'The ID of the user responsible for the transaction',
        format: 'uuid',
    })
    responsibleId: string;

    @ApiProperty({
        description: 'The amount of the transaction',
        example: 100.0,
    })
    amount: number;

    @ApiProperty({
        description: 'The ID of the payment method used in the transaction',
        format: 'uuid',
    })
    paymentMethodId: string;

    @ApiProperty({
        description: 'The type of the transaction',
    })
    type: TransactionType;

    constructor(transaction: Transaction) {
        super(transaction);
        this.description = transaction.description;
        this.originId = transaction.originId?.toString() ?? null;
        this.originType = transaction.originType;
        this.counterpartyId = transaction.counterpartyId?.toString() ?? null;
        this.responsibleId = transaction.responsibleId.toString();
        this.amount = transaction.amount;
        this.paymentMethodId = transaction.paymentMethodId.toString();
        this.type = transaction.type;
    }
}
