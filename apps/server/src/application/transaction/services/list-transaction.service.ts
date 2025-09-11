import {Injectable} from '@nestjs/common';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListTransactionDto, TransactionDto} from '../dtos';

@Injectable()
export class ListTransactionService implements ApplicationService<ListTransactionDto, PaginatedDto<TransactionDto>> {
    constructor(private readonly transactionRepository: TransactionRepository) {}

    async execute({payload}: Command<ListTransactionDto>): Promise<PaginatedDto<TransactionDto>> {
        const result = await this.transactionRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                amount: payload.amount,
                paymentMethodId: payload.paymentMethodId,
                description: payload.description,
                originId: payload.originId,
                originType: payload.originType,
                type: payload.type,
                counterpartyId: payload.counterpartyId,
                responsibleId: payload.responsibleId,
            }
        );

        return {
            ...result,
            data: result.data.map((transaction) => new TransactionDto(transaction)),
        };
    }
}
