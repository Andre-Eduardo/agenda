import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Employee} from '../entities';

export class EmployeeCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'EMPLOYEE_CREATED';
    readonly employee: Employee;

    constructor(props: DomainEventProps<EmployeeCreatedEvent>) {
        super(EmployeeCreatedEvent.type, props);
        this.employee = props.employee;
    }
}
