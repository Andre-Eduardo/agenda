import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AccountMovementDto} from '@application/appointment-payment/dtos';
import {AccountStatementDto, FinancialAccountDto, GetAccountStatementDto} from '@application/financial-account/dtos';
import {loadFinancialAccount} from '@application/financial-account/services/load-financial-account';
import type {FinancialAccountId} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';
import {FinancialEntryRepository} from '@domain/financial-entry/financial-entry.repository';

export type GetAccountStatementCommand = GetAccountStatementDto & {id: FinancialAccountId};

/** Extrato da conta: entradas e saídas, mais recentes primeiro. */
@Injectable()
export class GetAccountStatementService implements ApplicationService<GetAccountStatementCommand, AccountStatementDto> {
    constructor(
        private readonly financialAccountRepository: FinancialAccountRepository,
        private readonly financialEntryRepository: FinancialEntryRepository
    ) {}

    async execute({actor, payload}: Command<GetAccountStatementCommand>): Promise<AccountStatementDto> {
        const account = await loadFinancialAccount(this.financialAccountRepository, actor, payload.id);
        const {page, pageSize} = payload;

        const [movements, balances] = await Promise.all([
            this.financialEntryRepository.listMovements(
                {
                    clinicId: actor.clinicId,
                    accountId: account.id,
                    from: payload.from ? new Date(payload.from) : null,
                    to: payload.to ? new Date(payload.to) : null,
                },
                page,
                pageSize
            ),
            this.financialAccountRepository.balances(actor.clinicId),
        ]);

        return new AccountStatementDto({
            account: new FinancialAccountDto(account, balances.get(account.id.toString()) ?? 0),
            data: movements.data.map((movement) => new AccountMovementDto(movement, account.name)),
            totalCount: movements.total,
            page,
            pageSize,
        });
    }
}
