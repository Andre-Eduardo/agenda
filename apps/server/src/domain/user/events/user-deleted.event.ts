import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {User} from '../entities';

export class UserDeletedEvent extends DomainEvent {
    static readonly type = 'USER_DELETED';
    readonly user: User;

    constructor(props: DomainEventProps<UserDeletedEvent>) {
        super(UserDeletedEvent.type, props.timestamp);
        this.user = props.user;
    }
}
