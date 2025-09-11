import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Transaction} from '../entities';

export class TransactionCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'TRANSACTION_CREATED';
    readonly transaction: Transaction;

    constructor(props: DomainEventProps<TransactionCreatedEvent>) {
        super(TransactionCreatedEvent.type, props);
        this.transaction = props.transaction;
    }
}
