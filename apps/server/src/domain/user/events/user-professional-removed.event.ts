import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ProfessionalId} from '../../professional/entities';
import type {UserId} from '../entities';

export class UserProfessionalRemovedEvent extends DomainEvent {
    static readonly type = 'USER_PROFESSIONAL_REMOVED';
    readonly userId: UserId;
    readonly professionalId: ProfessionalId;

    constructor(props: DomainEventProps<UserProfessionalRemovedEvent>) {
        super(UserProfessionalRemovedEvent.type, props.timestamp);
        this.userId = props.userId;
        this.professionalId = props.professionalId;
    }
}
