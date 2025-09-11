import {Injectable} from '@nestjs/common';
import {Actor} from '../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DirectSaleRepository} from '../../../domain/sale/direct-sale.repository';
import {DirectSale} from '../../../domain/sale/entities';
import {Transaction, TransactionOriginType, TransactionType} from '../../../domain/transaction/entities';
import {TransactionRepository} from '../../../domain/transaction/transaction.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DirectSaleDto, UpdateDirectSaleDto} from '../dtos';

@Injectable()
export class UpdateDirectSaleService implements ApplicationService<UpdateDirectSaleDto, DirectSaleDto> {
    constructor(
        private readonly directSaleRepository: DirectSaleRepository,
        private readonly transactionRepository: TransactionRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateDirectSaleDto>): Promise<DirectSaleDto> {
        const directSale = await this.directSaleRepository.findById(payload.id);

        if (directSale === null) {
            throw new ResourceNotFoundException('Direct sale not found', payload.id.toString());
        }

        directSale.change(payload);

        await this.saveTransactions(actor, directSale, payload.transactions);

        await this.directSaleRepository.save(directSale);

        this.eventDispatcher.dispatch(actor, directSale);

        return new DirectSaleDto(directSale);
    }

    private async saveTransactions(
        actor: Actor,
        directSale: DirectSale,
        newTransactions: UpdateDirectSaleDto['transactions']
    ): Promise<void> {
        const currentTransactions =
            (
                await this.transactionRepository.search(
                    directSale.companyId,
                    {
                        limit: 100,
                        sort: {},
                    },
                    {
                        originId: directSale.id,
                        originType: TransactionOriginType.DIRECT_SALE,
                    }
                )
            )?.data ?? [];

        this.validateTotalPaid(directSale, currentTransactions, newTransactions);

        if (!newTransactions || newTransactions.length === 0) {
            return;
        }

        for (const newTransaction of newTransactions) {
            let transaction: Transaction | undefined;

            if ('id' in newTransaction) {
                transaction = currentTransactions.find(({id}) => id.equals(newTransaction.id));

                if (transaction === undefined) {
                    throw new ResourceNotFoundException('Transaction not found', newTransaction.id.toString());
                }

                transaction.change(newTransaction);
            } else {
                transaction = Transaction.create({
                    companyId: directSale.companyId,
                    responsibleId: actor.userId,
                    counterpartyId: directSale.buyerId,
                    amount: newTransaction.amount,
                    paymentMethodId: newTransaction.paymentMethodId,
                    type: TransactionType.INCOME,
                    originId: directSale.id,
                    originType: TransactionOriginType.DIRECT_SALE,
                });
            }

            await this.transactionRepository.save(transaction);

            this.eventDispatcher.dispatch(actor, transaction);
        }
    }

    private validateTotalPaid(
        directSale: DirectSale,
        currentTransactions: Transaction[],
        newTransactions: UpdateDirectSaleDto['transactions'] = []
    ): void {
        const currentTotalPaid = currentTransactions
            .filter(({id}) => !newTransactions.some((t) => 'id' in t && t.id.equals(id)))
            .reduce((total, transaction) => total + transaction.amount, 0);

        const newTotalPaid = newTransactions.reduce((total, transaction) => total + (transaction.amount ?? 0), 0);

        const totalPaid = currentTotalPaid + newTotalPaid;

        if (totalPaid !== directSale.getTotalValue()) {
            throw new PreconditionException('The total amount does not match the amount paid.');
        }
    }
}
