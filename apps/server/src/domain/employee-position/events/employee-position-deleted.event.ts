import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {EmployeePosition} from '../entities';

export class EmployeePositionDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'EMPLOYEE_POSITION_DELETED';
    readonly employeePosition: EmployeePosition;

    constructor(props: DomainEventProps<EmployeePositionDeletedEvent>) {
        super(EmployeePositionDeletedEvent.type, props);
        this.employeePosition = props.employeePosition;
    }
}
