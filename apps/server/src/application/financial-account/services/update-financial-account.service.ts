import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {FinancialAccountDto, UpdateFinancialAccountDto} from '@application/financial-account/dtos';
import {loadFinancialAccount} from '@application/financial-account/services/load-financial-account';
import type {FinancialAccountId} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';

export type UpdateFinancialAccountCommand = UpdateFinancialAccountDto & {id: FinancialAccountId};

@Injectable()
export class UpdateFinancialAccountService implements ApplicationService<
    UpdateFinancialAccountCommand,
    FinancialAccountDto
> {
    constructor(private readonly financialAccountRepository: FinancialAccountRepository) {}

    async execute({actor, payload}: Command<UpdateFinancialAccountCommand>): Promise<FinancialAccountDto> {
        const account = await loadFinancialAccount(this.financialAccountRepository, actor, payload.id);

        account.change({name: payload.name, active: payload.active});
        await this.financialAccountRepository.save(account);

        const balances = await this.financialAccountRepository.balances(actor.clinicId);

        return new FinancialAccountDto(account, balances.get(account.id.toString()) ?? 0);
    }
}
