import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Maintenance} from '../entities';

export class MaintenanceCreatedEvent extends CompanyDomainEvent {
    static readonly type = 'MAINTENANCE_CREATED';
    readonly maintenance: Maintenance;

    constructor(props: DomainEventProps<MaintenanceCreatedEvent>) {
        super(MaintenanceCreatedEvent.type, props);
        this.maintenance = props.maintenance;
    }
}
