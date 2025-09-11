import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {User} from '../entities';

export class UserSignedUpEvent extends DomainEvent {
    static readonly type = 'USER_SIGNED_UP';
    readonly user: User;

    constructor(props: DomainEventProps<UserSignedUpEvent>) {
        super(UserSignedUpEvent.type, props.timestamp);
        this.user = props.user;
    }
}
