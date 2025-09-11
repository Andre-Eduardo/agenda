import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {UserId} from '../entities';

export class UserCompanyRemovedEvent extends CompanyDomainEvent {
    static readonly type = 'USER_COMPANY_REMOVED';
    readonly userId: UserId;

    constructor(props: DomainEventProps<UserCompanyRemovedEvent>) {
        super(UserCompanyRemovedEvent.type, props);
        this.userId = props.userId;
    }
}
