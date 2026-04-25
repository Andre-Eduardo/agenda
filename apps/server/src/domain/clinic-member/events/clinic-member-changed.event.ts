import type {DomainEventProps} from '../../event';
import {DomainEvent} from '../../event';
import type {ClinicMember} from '../entities';

export class ClinicMemberChangedEvent extends DomainEvent {
    static readonly type = 'CLINIC_MEMBER_CHANGED';
    readonly oldState: ClinicMember;
    readonly newState: ClinicMember;

    constructor(props: DomainEventProps<ClinicMemberChangedEvent>) {
        super(ClinicMemberChangedEvent.type, props.timestamp);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
