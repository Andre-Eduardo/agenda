import {Injectable} from '@nestjs/common';
import {AccountRepository} from '../../../domain/account/account.repository';
import {Account} from '../../../domain/account/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AccountDto, CreateAccountDto} from '../dtos';

@Injectable()
export class CreateAccountService implements ApplicationService<CreateAccountDto, AccountDto> {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateAccountDto>): Promise<AccountDto> {
        const account = Account.create(payload);

        await this.accountRepository.save(account);

        this.eventDispatcher.dispatch(actor, account);

        return new AccountDto(account);
    }
}
