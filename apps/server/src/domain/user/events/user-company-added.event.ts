import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {UserId} from '../entities';

export class UserCompanyAddedEvent extends CompanyDomainEvent {
    static readonly type = 'USER_COMPANY_ADDED';
    readonly userId: UserId;

    constructor(props: DomainEventProps<UserCompanyAddedEvent>) {
        super(UserCompanyAddedEvent.type, props);
        this.userId = props.userId;
    }
}
