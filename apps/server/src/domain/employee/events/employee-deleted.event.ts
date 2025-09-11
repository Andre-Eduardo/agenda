import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Employee} from '../entities';

export class EmployeeDeletedEvent extends CompanyDomainEvent {
    static readonly type = 'EMPLOYEE_DELETED';
    readonly employee: Employee;

    constructor(props: DomainEventProps<EmployeeDeletedEvent>) {
        super(EmployeeDeletedEvent.type, props);
        this.employee = props.employee;
    }
}
