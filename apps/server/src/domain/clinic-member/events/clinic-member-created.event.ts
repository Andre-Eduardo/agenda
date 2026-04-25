import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicMember} from '../entities';

export class ClinicMemberCreatedEvent extends DomainEvent {
    static readonly type = 'CLINIC_MEMBER_CREATED';
    readonly member: ClinicMember;

    constructor(props: DomainEventProps<ClinicMemberCreatedEvent>) {
        super(ClinicMemberCreatedEvent.type, props.timestamp);
        this.member = props.member;
    }
}
