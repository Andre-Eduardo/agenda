import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Maintenance} from '../entities';

export class MaintenanceChangedEvent extends CompanyDomainEvent {
    static readonly type = 'MAINTENANCE_CHANGED';
    readonly oldState: Maintenance;
    readonly newState: Maintenance;

    constructor(props: DomainEventProps<MaintenanceChangedEvent>) {
        super(MaintenanceChangedEvent.type, props);
        this.oldState = props.oldState;
        this.newState = props.newState;
    }
}
