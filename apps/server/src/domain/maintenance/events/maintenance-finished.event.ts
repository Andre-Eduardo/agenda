import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';

export class MaintenanceFinishedEvent extends CompanyDomainEvent {
    static readonly type = 'MAINTENANCE_FINISHED';
    readonly maintenanceId: RoomStatusId;
    readonly finishedById: UserId;

    constructor(props: DomainEventProps<MaintenanceFinishedEvent>) {
        super(MaintenanceFinishedEvent.type, props);
        this.maintenanceId = props.maintenanceId;
        this.finishedById = props.finishedById;
    }
}
