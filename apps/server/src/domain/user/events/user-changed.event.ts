import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {User} from '../entities';

export class UserChangedEvent extends DomainEvent {
    static readonly type = 'USER_CHANGED';
    readonly oldState: User;
    readonly newState: User;

    constructor(props: DomainEventProps<UserChangedEvent>) {
        super(UserChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
