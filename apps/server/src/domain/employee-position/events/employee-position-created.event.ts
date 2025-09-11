import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {EmployeePosition} from '../entities';

export class EmployeePositionCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'EMPLOYEE_POSITION_CREATED';
    readonly employeePosition: EmployeePosition;

    constructor(props: DomainEventProps<EmployeePositionCreatedEvent>) {
        super(EmployeePositionCreatedEvent.type, props);
        this.employeePosition = props.employeePosition;
    }
}
