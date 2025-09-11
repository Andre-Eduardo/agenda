import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Account} from '../entities';

export class AccountDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'ACCOUNT_DELETED';
    readonly account: Account;

    constructor(props: DomainEventProps<AccountDeletedEvent>) {
        super(AccountDeletedEvent.type, props);
        this.account = props.account;
    }
}
