import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {CreateFinancialAccountDto, FinancialAccountDto} from '@application/financial-account/dtos';
import {FinancialAccount} from '@domain/financial-account/entities';
import {FinancialAccountRepository} from '@domain/financial-account/financial-account.repository';

@Injectable()
export class CreateFinancialAccountService implements ApplicationService<
    CreateFinancialAccountDto,
    FinancialAccountDto
> {
    constructor(private readonly financialAccountRepository: FinancialAccountRepository) {}

    async execute({actor, payload}: Command<CreateFinancialAccountDto>): Promise<FinancialAccountDto> {
        const account = FinancialAccount.create({
            clinicId: actor.clinicId,
            name: payload.name,
            type: payload.type,
            active: true,
            isDefault: false,
        });

        await this.financialAccountRepository.save(account);

        return new FinancialAccountDto(account, 0);
    }
}
