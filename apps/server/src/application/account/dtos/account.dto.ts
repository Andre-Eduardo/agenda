import {ApiProperty} from '@nestjs/swagger';
import {Account, AccountType} from '../../../domain/account/entities';
import {CompanyEntityDto} from '../../@shared/dto';

export class AccountDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the account',
        example: 'Santander',
    })
    name: string;

    @ApiProperty({
        description: 'The type of the account',
        example: AccountType.BANK,
        enum: AccountType,
        enumName: 'AccountType',
    })
    type: AccountType;

    @ApiProperty({
        description: 'The bank ID of the account',
        example: 1,
    })
    bankId: number | null;

    @ApiProperty({
        description: 'The agency number of the account',
        example: 1234,
    })
    agencyNumber: number | null;

    @ApiProperty({
        description: 'The agency digit of the account',
        example: 1,
    })
    agencyDigit: string | null;

    @ApiProperty({
        description: 'The account digit of the account',
        example: 1,
    })
    accountDigit: string | null;

    @ApiProperty({
        description: 'The account number of the account',
        example: 12345,
    })
    accountNumber: number | null;

    constructor(account: Account) {
        super(account);
        this.companyId = account.companyId.toString();
        this.name = account.name;
        this.type = account.type;
        this.bankId = account.bankId ?? null;
        this.agencyNumber = account.agencyNumber ?? null;
        this.agencyDigit = account.agencyDigit ?? null;
        this.accountDigit = account.accountDigit ?? null;
        this.accountNumber = account.accountNumber ?? null;
    }
}
