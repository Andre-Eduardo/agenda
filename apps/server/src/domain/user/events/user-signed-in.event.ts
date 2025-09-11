import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UserId} from '../entities';

export class UserSignedInEvent extends DomainEvent {
    static readonly type = 'USER_SIGNED_IN';
    readonly userId: UserId;

    constructor(props: DomainEventProps<UserSignedInEvent>) {
        super(UserSignedInEvent.type, props.timestamp);
        this.userId = props.userId;
    }
}
