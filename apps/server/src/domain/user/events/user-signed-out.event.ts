import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UserId} from '../entities';

export class UserSignedOutEvent extends DomainEvent {
    static readonly type = 'USER_SIGNED_OUT';
    readonly userId: UserId;

    constructor(props: DomainEventProps<UserSignedOutEvent>) {
        super(UserSignedOutEvent.type, props.timestamp);
        this.userId = props.userId;
    }
}
