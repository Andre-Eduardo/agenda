import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DirectSaleRepository} from '../../../domain/sale/direct-sale.repository';
import {DirectSale} from '../../../domain/sale/entities';
import {Transaction, TransactionOriginType, TransactionType} from '../../../domain/transaction/entities';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateDirectSaleDto, DirectSaleDto} from '../dtos';

@Injectable()
export class CreateDirectSaleService implements ApplicationService<CreateDirectSaleDto, DirectSaleDto> {
    constructor(
        private readonly directSaleRepository: DirectSaleRepository,
        private readonly transactionRepository: TransactionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateDirectSaleDto>): Promise<DirectSaleDto> {
        const directSale = DirectSale.create({...payload, sellerId: actor.userId});

        const totalAmount = payload.transactions.reduce((total, transaction) => total + transaction.amount, 0);

        if (totalAmount !== directSale.getTotalValue()) {
            throw new PreconditionException('The total amount does not match the amount paid.');
        }

        for (const transaction of payload.transactions) {
            const newTransaction = Transaction.create({
                companyId: directSale.companyId,
                responsibleId: actor.userId,
                counterpartyId: directSale.buyerId,
                amount: transaction.amount,
                paymentMethodId: transaction.paymentMethodId,
                type: TransactionType.INCOME,
                originId: directSale.id,
                originType: TransactionOriginType.DIRECT_SALE,
            });

            await this.transactionRepository.save(newTransaction);

            this.eventDispatcher.dispatch(actor, newTransaction);
        }

        await this.directSaleRepository.save(directSale);

        this.eventDispatcher.dispatch(actor, directSale);

        return new DirectSaleDto(directSale);
    }
}
