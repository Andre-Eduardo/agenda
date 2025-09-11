import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {TransactionDto, UpdateTransactionDto} from '../dtos';

@Injectable()
export class UpdateTransactionService implements ApplicationService<UpdateTransactionDto, TransactionDto> {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateTransactionDto>): Promise<TransactionDto> {
        const transaction = await this.transactionRepository.findById(payload.id);

        if (transaction === null) {
            throw new ResourceNotFoundException('Transaction not found', payload.id.toString());
        }

        transaction.change(payload);

        await this.transactionRepository.save(transaction);

        this.eventDispatcher.dispatch(actor, transaction);

        return new TransactionDto(transaction);
    }
}
