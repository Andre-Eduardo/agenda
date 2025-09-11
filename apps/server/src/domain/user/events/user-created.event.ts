import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {User} from '../entities';

export class UserCreatedEvent extends DomainEvent {
    static readonly type = 'USER_CREATED';
    readonly user: User;

    constructor(props: DomainEventProps<UserCreatedEvent>) {
        super(UserCreatedEvent.type, props.timestamp);
        this.user = props.user;
    }
}
