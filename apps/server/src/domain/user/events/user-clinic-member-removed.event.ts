import type {ClinicMemberId} from '../../clinic-member/entities';
import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UserId} from '../entities';

export class UserClinicMemberRemovedEvent extends DomainEvent {
    static readonly type = 'USER_CLINIC_MEMBER_REMOVED';
    readonly userId: UserId;
    readonly clinicMemberId: ClinicMemberId;

    constructor(props: DomainEventProps<UserClinicMemberRemovedEvent>) {
        super(UserClinicMemberRemovedEvent.type, props.timestamp);
        this.userId = props.userId;
        this.clinicMemberId = props.clinicMemberId;
    }
}
