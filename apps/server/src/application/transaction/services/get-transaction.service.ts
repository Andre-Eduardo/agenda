import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetTransactionDto, TransactionDto} from '../dtos';

@Injectable()
export class GetTransactionService implements ApplicationService<GetTransactionDto, TransactionDto> {
    constructor(private readonly transactionRepository: TransactionRepository) {}

    async execute({payload}: Command<GetTransactionDto>): Promise<TransactionDto> {
        const transaction = await this.transactionRepository.findById(payload.id);

        if (!transaction) {
            throw new ResourceNotFoundException('Transaction not found', payload.id.toString());
        }

        return new TransactionDto(transaction);
    }
}
