import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicMember} from '../entities';

export class ClinicMemberDeletedEvent extends DomainEvent {
    static readonly type = 'CLINIC_MEMBER_DELETED';
    readonly member: ClinicMember;

    constructor(props: DomainEventProps<ClinicMemberDeletedEvent>) {
        super(ClinicMemberDeletedEvent.type, props.timestamp);
        this.member = props.member;
    }
}
