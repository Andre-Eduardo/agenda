import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {EmployeePosition} from '../entities';

export class EmployeePositionChangedEvent extends CompanyDomainEvent {
    static readonly type = 'EMPLOYEE_POSITION_CHANGED';
    readonly oldState: EmployeePosition;
    readonly newState: EmployeePosition;

    constructor(props: DomainEventProps<EmployeePositionChangedEvent>) {
        super(EmployeePositionChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
