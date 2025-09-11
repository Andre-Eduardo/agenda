import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Account} from '../entities';

export class AccountCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'ACCOUNT_CREATED';
    readonly account: Account;

    constructor(props: DomainEventProps<AccountCreatedEvent>) {
        super(AccountCreatedEvent.type, props);
        this.account = props.account;
    }
}
