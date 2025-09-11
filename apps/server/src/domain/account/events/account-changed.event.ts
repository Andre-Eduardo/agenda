import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Account} from '../entities';

export class AccountChangedEvent extends CompanyDomainEvent {
    static readonly type = 'ACCOUNT_CHANGED';
    readonly oldState: Account;
    readonly newState: Account;

    constructor(props: DomainEventProps<AccountChangedEvent>) {
        super(AccountChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
