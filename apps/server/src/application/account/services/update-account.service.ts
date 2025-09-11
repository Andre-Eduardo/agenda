import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AccountRepository} from '../../../domain/account/account.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AccountDto, UpdateAccountDto} from '../dtos';

@Injectable()
export class UpdateAccountService implements ApplicationService<UpdateAccountDto, AccountDto> {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateAccountDto>): Promise<AccountDto> {
        const account = await this.accountRepository.findById(payload.id);

        if (!account) {
            throw new ResourceNotFoundException('Account not found', payload.id.toString());
        }

        account.change(payload);

        await this.accountRepository.save(account);

        this.eventDispatcher.dispatch(actor, account);

        return new AccountDto(account);
    }
}
