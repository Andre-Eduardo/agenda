import {Injectable} from '@nestjs/common';
import {EventDispatcher} from '../../../domain/event';
import {Transaction} from '../../../domain/transaction/entities';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateTransactionDto, TransactionDto} from '../dtos';

@Injectable()
export class CreateTransactionService implements ApplicationService<CreateTransactionDto, TransactionDto> {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateTransactionDto>): Promise<TransactionDto> {
        const transaction = Transaction.create(payload);

        await this.transactionRepository.save(transaction);

        this.eventDispatcher.dispatch(actor, transaction);

        return new TransactionDto(transaction);
    }
}
