import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AccountRepository} from '../../../domain/account/account.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteAccountDto} from '../dtos';

@Injectable()
export class DeleteAccountService implements ApplicationService<DeleteAccountDto> {
    constructor(
        private readonly accountRepository: AccountRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteAccountDto>): Promise<void> {
        const account = await this.accountRepository.findById(payload.id);

        if (!account) {
            throw new ResourceNotFoundException('Account not found', payload.id.toString());
        }

        account.delete();

        await this.accountRepository.delete(payload.id);

        this.eventDispatcher.dispatch(actor, account);
    }
}
