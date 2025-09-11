import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UserId} from '../entities';

export class UserPasswordChangedEvent extends DomainEvent {
    static readonly type = 'USER_PASSWORD_CHANGED';
    readonly userId: UserId;

    constructor(props: DomainEventProps<UserPasswordChangedEvent>) {
        super(UserPasswordChangedEvent.type, props.timestamp);
        this.userId = props.userId;
    }
}
