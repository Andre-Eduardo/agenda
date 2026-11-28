import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import {AccountMovementDto} from '@application/appointment-payment/dtos';
import {brlFromCents} from '@domain/appointment-payment/brl';
import {FinancialAccountType} from '@domain/financial-account/entities';
import type {FinancialAccount} from '@domain/financial-account/entities';

@ApiSchema({name: 'FinancialAccount'})
export class FinancialAccountDto extends EntityDto {
    @ApiProperty({format: 'uuid'})
    clinicId: string;

    @ApiProperty({example: 'Caixa'})
    name: string;

    @ApiProperty({enum: FinancialAccountType, enumName: 'FinancialAccountType'})
    type: FinancialAccountType;

    @ApiProperty()
    active: boolean;

    @ApiProperty({description: 'Default account of its type: receives payments made without a chosen account'})
    isDefault: boolean;

    @ApiProperty({description: 'Balance in BRL: everything that came in minus everything that went out'})
    balanceBrl: number;

    constructor(account: FinancialAccount, balanceCents: number) {
        super(account);
        this.clinicId = account.clinicId.toString();
        this.name = account.name;
        this.type = account.type;
        this.active = account.active;
        this.isDefault = account.isDefault;
        this.balanceBrl = brlFromCents(balanceCents);
    }
}

@ApiSchema({name: 'AccountStatement'})
export class AccountStatementDto {
    @ApiProperty({type: FinancialAccountDto})
    account: FinancialAccountDto;

    @ApiProperty({type: [AccountMovementDto]})
    data: AccountMovementDto[];

    @ApiProperty()
    totalCount: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    pageSize: number;

    constructor(props: {
        account: FinancialAccountDto;
        data: AccountMovementDto[];
        totalCount: number;
        page: number;
        pageSize: number;
    }) {
        this.account = props.account;
        this.data = props.data;
        this.totalCount = props.totalCount;
        this.page = props.page;
        this.pageSize = props.pageSize;
    }
}
