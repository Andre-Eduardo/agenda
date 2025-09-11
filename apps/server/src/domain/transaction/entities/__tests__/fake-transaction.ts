import {CompanyId} from '../../../company/entities';
import {PaymentMethodId} from '../../../payment-method/entities';
import {PersonId} from '../../../person/entities';
import {ReservationId} from '../../../reservation/entities';
import {UserId} from '../../../user/entities';
import {Transaction, TransactionId, TransactionOriginType, TransactionType} from '../transaction.entity';

export function fakeTransaction(payload: Partial<Transaction> = {}): Transaction {
    return new Transaction({
        id: TransactionId.generate(),
        companyId: CompanyId.generate(),
        counterpartyId: PersonId.generate(),
        responsibleId: UserId.generate(),
        amount: 1000,
        paymentMethodId: PaymentMethodId.generate(),
        description: 'Description',
        type: TransactionType.EXPENSE,
        originId: ReservationId.generate(),
        originType: TransactionOriginType.RESERVATION,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
