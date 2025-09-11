import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Transaction} from '../entities';

export class TransactionChangedEvent extends CompanyDomainEvent {
    static readonly type = 'TRANSACTION_CHANGED';
    readonly oldState: Transaction;
    readonly newState: Transaction;

    constructor(props: DomainEventProps<TransactionChangedEvent>) {
        super(TransactionChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
