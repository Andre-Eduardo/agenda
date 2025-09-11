import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AccountRepository} from '../../../domain/account/account.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AccountDto, GetAccountDto} from '../dtos';

@Injectable()
export class GetAccountService implements ApplicationService<GetAccountDto, AccountDto> {
    constructor(private readonly accountRepository: AccountRepository) {}

    async execute({payload}: Command<GetAccountDto>): Promise<AccountDto> {
        const account = await this.accountRepository.findById(payload.id);

        if (!account) {
            throw new ResourceNotFoundException('Account not found', payload.id.toString());
        }

        return new AccountDto(account);
    }
}
