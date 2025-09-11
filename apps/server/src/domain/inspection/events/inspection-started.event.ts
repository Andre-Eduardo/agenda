import {CompanyDomainEvent} from '../../company/events';
import type {DomainEventProps} from '../../event';
import type {Inspection} from '../entities';

export class InspectionStartedEvent extends CompanyDomainEvent {
    static readonly type = 'INSPECTION_STARTED';
    readonly inspection: Inspection;

    constructor(props: DomainEventProps<InspectionStartedEvent>) {
        super(InspectionStartedEvent.type, props);
        this.inspection = props.inspection;
    }
}
