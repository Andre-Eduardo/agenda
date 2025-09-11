import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {PaymentMethodId} from '../../payment-method/entities';
import type {PersonId} from '../../person/entities';
import type {ReservationId} from '../../reservation/entities';
import type {SaleId} from '../../sale/entities';
import type {UserId} from '../../user/entities';
import {TransactionChangedEvent, TransactionCreatedEvent} from '../events';

export type TransactionProps = EntityProps<Transaction>;
export type CreateTransaction = CreateEntity<Transaction>;
export type UpdateTransaction = Partial<Transaction>;

export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

export enum TransactionOriginType {
    RESERVATION = 'RESERVATION',
    DIRECT_SALE = 'DIRECT_SALE',
}

export class Transaction extends AggregateRoot<TransactionId> {
    companyId: CompanyId;
    counterpartyId: PersonId | null;
    responsibleId: UserId;
    amount: number;
    paymentMethodId: PaymentMethodId;
    description: string | null;
    type: TransactionType;
    originId: ReservationId | SaleId | null;
    originType: TransactionOriginType | null;

    constructor(props: AllEntityProps<Transaction>) {
        super(props);
        this.companyId = props.companyId;
        this.counterpartyId = props.counterpartyId;
        this.responsibleId = props.responsibleId;
        this.amount = props.amount;
        this.paymentMethodId = props.paymentMethodId;
        this.description = props.description;
        this.type = props.type;
        this.originId = props.originId;
        this.originType = props.originType;
        this.validate();
    }

    static create(props: CreateTransaction): Transaction {
        const transactionId = TransactionId.generate();
        const now = new Date();
        const transaction = new Transaction({
            ...props,
            id: transactionId,
            description: props.description ?? null,
            counterpartyId: props.counterpartyId ?? null,
            originId: props.originId ?? null,
            originType: props.originType ?? null,
            createdAt: now,
            updatedAt: now,
        });

        transaction.addEvent(new TransactionCreatedEvent({companyId: props.companyId, transaction, timestamp: now}));

        return transaction;
    }

    change(props: UpdateTransaction): void {
        const oldTransaction = new Transaction(this);

        if (props.amount !== undefined) {
            this.amount = props.amount;
            this.validate('amount');
        }

        if (props.description !== undefined) {
            this.description = props.description;
        }

        if (props.type !== undefined) {
            this.type = props.type;
        }

        this.addEvent(
            new TransactionChangedEvent({companyId: this.companyId, oldState: oldTransaction, newState: this})
        );
    }

    toJSON(): EntityJson<Transaction> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            counterpartyId: this.counterpartyId?.toJSON() ?? null,
            responsibleId: this.responsibleId.toJSON(),
            amount: this.amount,
            paymentMethodId: this.paymentMethodId.toJSON(),
            description: this.description,
            type: this.type,
            originId: this.originId?.toJSON() ?? null,
            originType: this.originType,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof TransactionProps>): void {
        if (fields.length === 0 || fields.includes('amount')) {
            if (this.amount <= 0) {
                throw new InvalidInputException('The transaction amount must be positive.');
            }
        }

        if (fields.length === 0) {
            if ((this.originId !== null) !== (this.originType !== null)) {
                throw new InvalidInputException('Both origin ID and origin type must be provided together.');
            }
        }
    }
}

export class TransactionId extends EntityId<'TransactionId'> {
    static from(value: string): TransactionId {
        return new TransactionId(value);
    }

    static generate(): TransactionId {
        return new TransactionId();
    }
}
