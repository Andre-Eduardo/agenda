import type {ClinicMemberId} from '../../clinic-member/entities';
import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {UserId} from '../entities';

export class UserClinicMemberAddedEvent extends DomainEvent {
    static readonly type = 'USER_CLINIC_MEMBER_ADDED';
    readonly userId: UserId;
    readonly clinicMemberId: ClinicMemberId;

    constructor(props: DomainEventProps<UserClinicMemberAddedEvent>) {
        super(UserClinicMemberAddedEvent.type, props.timestamp);
        this.userId = props.userId;
        this.clinicMemberId = props.clinicMemberId;
    }
}
