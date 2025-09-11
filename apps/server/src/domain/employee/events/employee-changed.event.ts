import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Employee} from '../entities';

export class EmployeeChangedEvent extends CompanyDomainEvent {
    static readonly type = 'EMPLOYEE_CHANGED';
    readonly oldState: Employee;
    readonly newState: Employee;

    constructor(props: DomainEventProps<EmployeeChangedEvent>) {
        super(EmployeeChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
